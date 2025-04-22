import json
import re
from app import graph_client, scheduler

valid_gcc_emails = []
faculty_emails = []
student_emails = []

def load_gcc_emails():
    global valid_gcc_emails, faculty_emails, student_emails
    with open('gcc_emails.json') as file:
        valid_gcc_emails = json.loads(file.read())

    #Regular expressions for types of gcc email prefixes
    faculty_email_pattern = re.compile("^[a-z]*@gcc.edu$")
    student_email_pattern = re.compile("^[a-z]*[0-9]{2}@gcc.edu$")

    #Sorting emails by type
    faculty_emails = [email for email in valid_gcc_emails if faculty_email_pattern.match(email)]
    student_emails = [email for email in valid_gcc_emails if student_email_pattern.match(email)]

#Schedule graph api client to update the stored list of GCC emails every so often
def refresh_gcc_emails():
    global valid_gcc_emails

    #Get and cache gcc emails from graph api
    print("Refreshing valid GCC emails...")
    valid_gcc_emails = graph_client.get_gcc_emails()
    print("Refreshed valid GCC emails. Saving...")

    #Save the cache to a file for next time the server is run
    with open('gcc_emails.json', mode='w') as file:
        file.write(json.dumps(valid_gcc_emails))
    print("Saved new list of valid GCC emails.")

    #Load the new emails into the program
    load_gcc_emails()
scheduler.add_job(refresh_gcc_emails, trigger="interval", days=1)

def is_faculty_email(email: str) -> bool:
    '''
    Returns whether an email is a gcc faculty email
    '''
    return email.lower() in faculty_emails

def is_student_email(email: str) -> bool:
    '''
    Returns whether an email is a gcc student email
    '''
    return email.lower() in student_emails