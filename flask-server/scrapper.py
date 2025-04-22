import pdfplumber
import pandas as pd
import tabula
import re
import json
import os
from utils.fileutils import root_directory_path

# FSM for processing of the info
first_trans = {'Dr.', 'Mr.', 'Ms.', 'Mrs.'}
second_trans = {'1st', '2nd', '3rd'}
strange_utf8s = ['”', '“', '\u201c', '\u201d']

def is_alphanumeric(s):
    num ='123456789'
    for el in num:
        if el in s:
            return True
    return False

def strange_utf8_remove(s:str, chars:list[str]):
    for char in chars:
        s = s.replace(char, '')
    return s

# We want title firstname , lastname, middle name, office building, office number, department
class faculty:
    def __init__(self, name, address, phone_number, mailroom, department):
        self.name=name
        self.address=address
        self.phone_number=phone_number
        self.mailroom=mailroom
        self.department=department
        self.frag = name.split(' ')
        self.title = self.frag[0].split('.')[0] +'.'
        self.firstname = self.frag[0].split('.')[1]

        if (len(self.frag[1])<=3 and len(self.frag[1])>0):
            self.middlename = self.frag[1]
            self.lastname = self.frag[2]
        elif len(self.frag[1])>=3 and ('\u201d' in self.frag[1] or '\u201c' in self.frag[1]):
            self.title = self.frag[0].split('.')[0] +'.'
            self.middlename = 'x.'
            self.firstname = self.frag[1]+' '+self.firstname
            self.lastname = self.frag[2]
        else:
            self.middlename='x.'
            self.lastname = self.frag[1]

        self.title = strange_utf8_remove(self.title, strange_utf8s)
        self.firstname = strange_utf8_remove(self.firstname, strange_utf8s)
        self.middlename = strange_utf8_remove(self.middlename, strange_utf8s)
        self.lastname = strange_utf8_remove(self.lastname, strange_utf8s)
        self.address = strange_utf8_remove(self.address, strange_utf8s)
        self.department = strange_utf8_remove(self.department, strange_utf8s)
        self.json = {"title":self.title , "lastname":self.lastname, "middlename":self.middlename, "firstname":self.firstname, "address":self.address, "phone_number":self.phone_number, "mailroom":self.mailroom, "department":self.department}
    
    def get_name(self):
        return self.name
    
    def get_address(self):
        return self.address
    
    def get_phone_number(self):
        return self.phone_number
    
    def get_mailroom(self):
        return self.mailroom
    
    def get_department(self):
        return self.department
    
    def get_json(self):
        return self.json

def preprocess(li):
    faculties = []
    department = 'n/a'
    for s in li:
        if 'Department' not in s:
            faculties.append(process(s, department))
        else:
            s = s.split(' ')[2:]
            if s[-1]=='(cont.)':
                s= s[:-1]
            department=' '.join(s)
    return faculties
        
def process(s:str, department):
    # 1st node of the FSM suffix
    elements:list[str] = s.split(' ')
    suffix = ''
    if elements[0] in first_trans:
        suffix = elements[0]
        elements = elements[1:]

    if len(elements[0].split('-'))==2:
        if elements[0].split('-')[0].isdigit():
            elements = elements[1:]

    # 2nd node of the FSM name
    i = 0
    name = ''
    while not is_alphanumeric(elements[i]) and not elements[i].isnumeric() and elements[i]!='--' and (not elements[i] in second_trans) and elements[i]!='CC':
        name += elements[i] + ' '
        i= i+1
        #print(name)
    elements = elements[i:]

    
    # 3rd node of the FSM address
    j = 0
    if is_alphanumeric(elements[j]) or elements[j].isnumeric() or elements[j]=='--' or elements[j]=='CC':
        address = ''
        #print('debug', elements, j)
        # DO NOT DELETE THE SECOND "and len(elements[j].split('‐'))!=2" IT IS A DIFFERENT HYPHEN
        while j<len(elements) and len(elements[j].split('-'))!=2 and elements[j]!='--' and len(elements[j].split('‐'))!=2:
            address+= elements[j] + ' '
            j = j + 1
            
        #print('here?')
    elif elements[j] in second_trans and  elements[j+1] == 'floor':
        address = ''
        #print(elements[j])
        while len(elements[j].split('-'))!=2 and elements[j]!='--' and len(elements[j].split('‐'))!=2:
            address+= elements[j] + ' '
            j = j + 1
        #print(address)
    #print(address)
    elements = elements[j:]
    
    
    #4th node of the FSM phone number
    j = 0
    separate = ''
    phone_number =''
    delimiters = ['-','‐']
    if delimiters[0] in elements[j]:
        separate = delimiters[0]
    elif delimiters[1] in elements[j]:
        separate = delimiters[1]
    if len(elements[j].split(separate))==2 or elements[j]=='--':
        if len(elements[j].split(separate))==2:
            phone_number = int(''.join(list(elements[j].replace(separate, ''))))
        elif elements[j]=='--':
            phone_number = ''
            
        # 5th node of the FSM mailroom
        elements = elements[j:]
        k = 0
        if elements[k]=='--':
            mailroom = elements[k]
            while k+1<len(elements):
                mailroom+=' ' + elements[k+1]
                k = k+1
                
        elif elements[k+1].isnumeric() or elements[k+1].lower()=='crawford':
            mailroom = elements[k+1]
        else:
            mailroom = None
    
    return faculty(suffix+name,address,phone_number, mailroom, department) 

def remove_word(lst, word):
    return [item for item in lst if item != word]

def export_json(filename):
        
    # Read in the faculty pdf
    path = os.path.join(root_directory_path(), "uploads", filename)

    file = pdfplumber.open(path)
    # Extract all the text contained in each page
    pages_text = list(map(lambda y: y.split('\n'), list(map(lambda x: x.extract_text(), file.pages))))

    # More processing on characters
    flatten_pages=[]
    for page in pages_text:
        flatten_pages.extend(page)

    # process the numeric characters
    for row in flatten_pages:
        if row.isnumeric():
            flatten_pages.remove(row)

    # process the pages
    stopwords = ['Faculty by School and Department', 
                '2023-2024', 
                'Dean of School', 
                'Additional Faculty:', 
                'Rvsd','School', 
                'Name Room Building Ext. Box',
                'Additional Faculty/Staff:', 
                'Additional Faculty / Band and Music Lesson Instructors:', 
                'The Writing Center', 
                'Additional Faculty:', 
                'Assistant Dean', 
                'Alva J. Calderwood School of Arts and Letters',
                'The Office of Nursing Programs',
                'Campuswide Offices and Programs',
                'The Office of Global Programs', 
                'Paul J. McNulty, J.D. 1st Floor Crawford Hall 458-2500 Crawford',
                'The Office of Physical Education & Athletics (cont.)', 
                'The Office of Graduate and Online Programs',
                'The Office of Physical Education & Athletics']

    for word in stopwords:
        for row in flatten_pages:
            if word in row:
                flatten_pages.remove(row)

    for page in flatten_pages:
        if '‐' in page:
            page.replace('‐', '-')

    clean_flatten_pages = []
    for page in flatten_pages:
        if '-' in page:
            if (not page.split('-')[0].isdigit() and not page.split('-')[1].isdigit()):
                clean_flatten_pages.append(page)
        elif 'Department' in page:
            clean_flatten_pages.append(page)

    # get the faculty information
    faculties = preprocess(clean_flatten_pages)

    # Path to the JSON file
    file_path = os.path.join(root_directory_path(), "faculty_data.json")
    json_faculty = []
    for i in range(len(faculties)):
        #json_data = json.dumps(faculties[i].get_json(), indent=4)
        json_faculty.append(faculties[i].get_json())
        
    json_done = {"faculty":json_faculty}

    # Write JSON data to a file
    with open(file_path, "w") as json_file:
        json_file.write(json.dumps(json_done, indent=4))