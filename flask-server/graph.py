import requests
from azure.core.credentials import AccessToken
from msgraph import GraphServiceClient
from msgraph.generated.users.item.user_item_request_builder import UserItemRequestBuilder
from msgraph.generated.users.item.calendar.get_schedule.get_schedule_post_request_body import GetSchedulePostRequestBody

from msgraph.generated.models.event import Event
from msgraph.generated.models.email_address import EmailAddress
from msgraph.generated.models.attendee import Attendee
from msgraph.generated.models.attendee_type import AttendeeType
from msgraph.generated.models.date_time_time_zone import DateTimeTimeZone
from msgraph.generated.models.item_body import ItemBody
from msgraph.generated.models.body_type import BodyType
from msgraph.generated.models.message import Message
from msgraph.generated.models.recipient import Recipient
from msgraph.generated.users.item.send_mail.send_mail_post_request_body import SendMailPostRequestBody
from msgraph.generated.models.schedule_information import ScheduleInformation
from msgraph.generated.users.item.events.item.event_item_request_builder import EventItemRequestBuilder
from msgraph.generated.users.users_request_builder import UsersRequestBuilder
from msgraph.generated.models.user_collection_response import UserCollectionResponse
from datetime import datetime, time, date, timedelta, timezone
from utils.dateutils import times_ranges_between, time_ranges_overlap
from utils.asyncutils import wait_for
import re
def allowed_to_send_to_email(email: str) -> bool:
    #TODO: Remove in production! We don't want to spam
    #      profs. and students with fake meeting invites :)
    EMAIL_WHITELIST = ["belldw20@gcc.edu", "allarassemjj20@gcc.edu"]
    import utils.emailutils
    return email.lower() in EMAIL_WHITELIST and email.lower() in utils.emailutils.valid_gcc_emails

class GraphConfig:
    def __init__(self, config: dict[str,str]):
        self.clientID = config['clientID']
        self.tenantID = config['tenantID']
        self.clientSecret = config['clientSecret']
        self.email = config['email']
        self.password = config['password']
        self.scopes = config['scopes']

    @property
    def scopes_list(self) -> list[str]:
        return self.scopes.split(" ")

class AccessTokenCredentials:
    def __init__(self, accessToken: str, refreshToken: str, expiresOn: int) -> None:
        self.accessToken = accessToken
        self.refreshToken = refreshToken
        self.expiresOn = expiresOn

    def get_token(self, *scopes, **kwargs) -> AccessToken:
        return AccessToken(self.accessToken, self.expiresOn)
    
    @staticmethod
    def get_credentials_from_config(config: GraphConfig):
        print("Getting MSGraph credentials...")
        url = f'https://login.microsoftonline.com/{config.tenantID}/oauth2/token'
        data = {
            'grant_type': 'password',
            'client_id': config.clientID,
            'client_secret': config.clientSecret,
            'resource': 'https://graph.microsoft.com',
            'scope': 'https://graph.microsoft.com/.default',
            'username': config.email,
            'password': config.password
        }
        tokenRequest = requests.post(url, data=data)
        responseJson = tokenRequest.json()
        return AccessTokenCredentials(responseJson["access_token"], responseJson["refresh_token"], int(responseJson["expires_on"]))

def datetime_to_datetime_timezone(date_time: datetime) -> DateTimeTimeZone:
    msft = DateTimeTimeZone()
    DATETIME_FORMAT = "%Y-%m-%dT%H:%M:%S"
    msft.date_time = date_time.strftime(DATETIME_FORMAT)
    msft.time_zone = "Eastern Standard Time"
    return msft

def datetime_timezone_to_datetime(datetime_timezone: DateTimeTimeZone) -> datetime:
    DATETIME_FORMAT = "%Y-%m-%dT%H:%M:%S.0000000 %Z"
    as_utc_datetime = datetime.strptime(f"{str(datetime_timezone.date_time)} {str(datetime_timezone.time_zone)}", DATETIME_FORMAT).replace(tzinfo=timezone.utc)
    return as_utc_datetime.astimezone(None)

class GraphClient:
    def __init__(self, config: GraphConfig):
        self.config = config
        self.refresh_client_access()

    def refresh_client_access(self):
        self.__client = GraphServiceClient(
            AccessTokenCredentials.get_credentials_from_config(self.config),
            self.config.scopes_list
        )

    def get_service_client(self):
        return self.__client
    
    def get_user(self):
        request_config = UserItemRequestBuilder.UserItemRequestBuilderGetRequestConfiguration (
            query_parameters = UserItemRequestBuilder.UserItemRequestBuilderGetQueryParameters (
                select=['displayName', 'mail', 'userPrincipalName']
            )
        )

        user = wait_for(self.__client.me.get(request_configuration=request_config))
        return {
            "name": user.display_name,
            "email": user.mail or user.user_principal_name
        }

    def create_meeting(self, subject: str, message: str, start: datetime, end: datetime, attendee_emails: list[str]):
        event = Event()
        event.subject = subject

        event.body = ItemBody()
        event.body.content_type = BodyType.Html
        event.body.content = message

        event.start = datetime_to_datetime_timezone(start)
        event.end = datetime_to_datetime_timezone(end)
        event.response_requested = True

        event.attendees = [
            Attendee(email_address=EmailAddress(address=email), type=AttendeeType.Required)
            for email in filter(lambda e: allowed_to_send_to_email(e), attendee_emails)
        ]

        event.allow_new_time_proposals = False
        event.is_online_meeting = False

        event = wait_for(self.__client.me.events.post(event))
        return event.id
    
    def cancel_meeting(self, meetingID: str):
        wait_for(self.__client.me.events.by_event_id(meetingID).delete())

    def get_meeting_status(self, meetingID: str):
        from tables.events import EventStatus

        request_config = EventItemRequestBuilder.EventItemRequestBuilderGetRequestConfiguration(
            query_parameters=EventItemRequestBuilder.EventItemRequestBuilderGetQueryParameters(
                select=['attendees']
            )
        )

        event : Event = wait_for(self.__client.me.events.by_event_id(meetingID).get(request_configuration=request_config))
        
        #By default, assume no response (in case we have no attendees)
        attendee_status = "none"
        if len(event.attendees) > 0:
            attendee_status = event.attendees[0].status.response

        if attendee_status in {"none", "tentativelyAccepted", "notResponded"}:
            return EventStatus.PENDING
        elif attendee_status == "accepted":
            return EventStatus.ACCEPTED
        else:
            return EventStatus.DECLINED

    def send_email(self, subject: str, body: str, recipient: str, content_type: BodyType = BodyType.Text):
        if not allowed_to_send_to_email(recipient):
            return
        
        message = Message()
        message.subject = subject

        message.body = ItemBody()
        message.body.content_type = content_type
        message.body.content = body

        to_recipient = Recipient()
        to_recipient.email_address = EmailAddress()
        to_recipient.email_address.address = recipient
        message.to_recipients = []
        message.to_recipients.append(to_recipient)

        request_body = SendMailPostRequestBody()
        request_body.message = message

        wait_for(self.__client.me.send_mail.post(body=request_body))

    def get_availability(self, emails: list[str], date: date, start_time: time, end_time: time) -> list[list[tuple[time,time]]]:
        #Helper function to convert graph responses into a usable format
        def schedule_to_availability(schedule : ScheduleInformation) -> list[tuple[time,time]]:
            #Convert time frames to tuples of typical python times from msft format
            schedule_items = []
            if schedule.schedule_items is not None:
                for item in schedule.schedule_items:
                    schedule_items.append((datetime_timezone_to_datetime(item.start).time(), datetime_timezone_to_datetime(item.end).time()))

            def overlaps_with_schedule(timeframe: tuple[time, time]):
                for busy_timeframe in schedule_items:
                    if time_ranges_overlap(timeframe, busy_timeframe):
                        return True
                return False

            #Find which fifteen minute time frames between the start and end don't overlap
            #with any of the busy time frames and return it
            return list(filter(lambda timeframe: not overlaps_with_schedule(timeframe), potential_availability))

        #Convert start / end times to date time using provided date
        start = datetime(date.year, date.month, date.day, start_time.hour, start_time.minute, start_time.second)
        end = datetime(date.year, date.month, date.day, end_time.hour, end_time.minute, end_time.second)
        
        #Graph API limits a request to asking for the availability of 20 entities at a time
        #we must break email list into chunks that large
        EMAILS_PER_CALL = 20
        email_lists = [emails[i * EMAILS_PER_CALL:(i + 1) * EMAILS_PER_CALL] for i in range((len(emails) + EMAILS_PER_CALL - 1) // EMAILS_PER_CALL )]  

        #Then we make and store the results of the graph call for each sublist above
        availabilities : list[list[tuple[time,time]]] = []

        def interval_ceil(tIme: time) -> time:
            intervals = tIme.minute // TIME_FRAME_INTERVAL_MIN 
            if tIme.minute % TIME_FRAME_INTERVAL_MIN != 0:
                intervals += 1

            hour = tIme.hour
            if intervals == 4:
                intervals = 0
                hour += 1

            return time(hour, intervals * TIME_FRAME_INTERVAL_MIN)

        for email_list in email_lists:
            #Get the time frames the people are busy for during this time frame
            TIME_FRAME_INTERVAL_MIN = 15

            body = GetSchedulePostRequestBody(
                availability_view_interval=TIME_FRAME_INTERVAL_MIN,
                start_time=datetime_to_datetime_timezone(start),
                end_time=datetime_to_datetime_timezone(end),
                schedules=email_list
            )
            
            schedules : list[ScheduleInformation] = wait_for(self.__client.me.calendar.get_schedule.post(body)).value

            #Setup time ranges to test each person's schedule availability for
            minStart : time = interval_ceil(start_time)
            maxEnd : time = time(end_time.hour, (end_time.minute//TIME_FRAME_INTERVAL_MIN)*TIME_FRAME_INTERVAL_MIN)
            potential_availability : list[(time,time)] = times_ranges_between(minStart, maxEnd, timedelta(minutes=TIME_FRAME_INTERVAL_MIN), timedelta(hours=1)) 

            #Put the availabilities into a dictionary identified by email (may be in a different order than they came in)
            availability_dict = dict()
            for schedule in schedules:
                availability_dict[schedule.schedule_id] = schedule_to_availability(schedule)
            
            #Add the availabilities to the availability list in the same order they were requested
            for email in email_list:
                availabilities.append(availability_dict[email])
        
        return availabilities

    '''
    Function to get gcc emails from graph API.
    GCC Emails are selected based on the following criteria:
        1. The email has "gcc.edu" in it
        2. The email is not None
    Output is a list of email strings
    '''
    def get_gcc_emails(self) -> list[str]:
        emails = []
        request_configuration = UsersRequestBuilder.UsersRequestBuilderGetRequestConfiguration(
            query_parameters = UsersRequestBuilder.UsersRequestBuilderGetQueryParameters(top=999)
        )

        #Get initial link to next page of data
        users : UserCollectionResponse = wait_for(self.__client.users.get(request_configuration=request_configuration))
        next_link = users.odata_next_link
        for user in users.value:
            if user.mail is not None:
                emails.append(user.mail)

        #While there is a next link, continue to get more emails
        while next_link is not None:
            users = wait_for(self.__client.users.with_url(next_link).get())
            next_link = users.odata_next_link
            for user in users.value:
                emails.append(user.mail)

        #Do basic filtering / transforming of all emails
        emails = [email.lower() for email in emails if email is not None]

        #Only keep gcc emails
        return [email for email in emails if "gcc.edu" in email]