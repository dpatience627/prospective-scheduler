from graph import GraphClient, GraphConfig
from msgraph.generated.users.users_request_builder import UsersRequestBuilder
import json
from msgraph import GraphServiceClient
import asyncio
import re
from app import app, db, graph_client
from tables.faculty import Faculty






async def get_graph_emails(test_graph_client):
    mail_list = []
    tuple_list = []
    #Gets initial page of data
    query_params = UsersRequestBuilder.UsersRequestBuilderGetQueryParameters(
        top=500
    )
    request_configuration = UsersRequestBuilder.UsersRequestBuilderGetRequestConfiguration(
        query_parameters = query_params,
    )
    users_one = await test_graph_client.users.get(request_configuration=request_configuration)
    print(len(users_one.value))
    next_link = users_one.odata_next_link
    for user in users_one.value:
        tuple_list.append((user.mail, user.display_name))
        mail_list.append(user.mail)
    mail_list = list(filter(lambda x: x is not None, mail_list))
    mail_list = list(filter(lambda x: "GCC.EDU" in x or "gcc.edu" in x, mail_list))
    mail_list = list(filter(lambda x: not bool(re.search(r"\d", x)), mail_list))
    tuple_list = list(filter(lambda x: x[0] is not None, tuple_list))
    tuple_list = list(filter(lambda x: "GCC.EDU" in x[0] or "gcc.edu" in x[0], tuple_list))
    tuple_list = list(filter(lambda x: not bool(re.search(r"\d", x[0])), tuple_list))
    
    while(next_link):
        print(next_link)
        users_one = await test_graph_client.users.with_url(next_link).get()
        next_link = users_one.odata_next_link
        for user in users_one.value:
            tuple_list.append((user.mail, user.display_name))
        #Lists get filtered, removing none values, non gcc.edu emails, and emails with numbers
        mail_list = list(filter(lambda x: x is not None, mail_list))
        mail_list = list(filter(lambda x: "GCC.EDU" in x or "gcc.edu" in x, mail_list))
        mail_list = list(filter(lambda x: not bool(re.search(r"\d", x)), mail_list))
        tuple_list = list(filter(lambda x: x[0] is not None, tuple_list))
        tuple_list = list(filter(lambda x: "GCC.EDU" in x[0] or "gcc.edu" in x[0], tuple_list))
        tuple_list = list(filter(lambda x: not bool(re.search(r"\d", x[0])), tuple_list))
    
    #tuple_list = [(x.lower(), y.lower()) for x, y in tuple_list]
   # tuple_list = list(filter(lambda x: "GCC.EDU" in x[0] or "gcc.edu" in x[0], tuple_list))
    #tuple_list = list(filter(lambda x: not bool(re.search(r"\d", x[0])), tuple_list))
    
    mail_list = [x.lower() for x in mail_list]
    return tuple_list

#Tests if email exists in emails taken from micrsofot graph
def does_email_exist(retrieved_emails, email_to_test):
    return email_to_test.lower() in retrieved_emails

def get_invalid_emails(retrieved_emails, scraped_emails):
    invalid_emails = []
    for email in scraped_emails:
        #print(email.lower())
        #print(email.lower() in retrieved_emails)

        if not does_email_exist(retrieved_emails, email):
            
            invalid_emails.append(email)

    return invalid_emails

def invalid_tuples_generation(scraped_emails, email_tuples):
    to_return = []
    for email, name in email_tuples:
        print(email)
        if(email in scraped_emails):
            to_return.append((email, name))
    return to_return

def fix_invalid_emails(invalid_emails, email_tuples):
    correct_emails = []
    for email in invalid_emails:
        with app.app_context():
            faculty_to_edit = Faculty.query.filter(Faculty.Email == email and Faculty.Archived == 0).first()
            first_name_to_search = faculty_to_edit.FirstName
            last_name_to_search = faculty_to_edit.LastName 

            #print((first_name_to_search, last_name_to_search))
        for email, name in email_tuples:
            name_split = name.split(', ')
            #print(name_split)
            if(len(name_split) == 2):
                if (first_name_to_search.lower() in name_split[0] and last_name_to_search.lower() in name_split[1]) and (email not in correct_emails):
                    correct_emails.append(email)
                    #print(name)
    
    return correct_emails


async def test_single_email(email_to_check):
    test_graph_client : GraphServiceClient = graph_client.get_service_client()
    test_val = await test_graph_client.users.get()


def test_run():
    with app.app_context():
        faculty_email_list_init:list[str] = db.session.query(Faculty.Email).all()
        faculty_email_list = [email[0] for email in faculty_email_list_init]
    faculty_email_list = [x.lower() for x in faculty_email_list]
    retrieved_emails = []
    names = []
    asyncio.new_event_loop()
    try:
        #asyncio.new_event_loop()
        print("doing config stuff i guess")
        with open('config.json') as fin:
            config = json.load(fin)
        #test_client : GraphClient = GraphClient(GraphConfig(config["graph_config"]))
        
        test_graph_client : GraphServiceClient = graph_client.get_service_client()
        #asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
        full_list = asyncio.run(get_graph_emails(test_graph_client))
        #print(full_list)
        for email, name in full_list:
            retrieved_emails.append(email.lower())
        #print(retrieved_emails)
        #full_tuple_list = dict(full_lists[1])
        #full_email_list = full_lists[0]
        #print("Getting Emails from Graph API")
        #invalid_email_list = get_invalid_emails(scraped_emails=faculty_email_list, retrieved_emails=retrieved_emails)
        testing_reduce_tuple = invalid_tuples_generation(scraped_emails=faculty_email_list, email_tuples=full_list)
        print(testing_reduce_tuple)
        #testing_fixing = fix_invalid_emails(invalid_emails=invalid_email_list,email_tuples=full_list)
        #print(testing_fixing)
        #return invalid_email_list
    except Exception as e:
        print(e)

#test_run()
    
