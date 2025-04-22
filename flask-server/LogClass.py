from datetime import datetime
from utils.fileutils import root_directory_path
import os
import inspect

'''
Description: <Takes in a function and returns the class that wrapps it>
Input: A function
Output: A class name | None
Eg: 
>> test= test() // A class with a method mymethod
>> f = test.mymethod() // Calling the method
>> get_class_name(f) // will return test
'''
def get_class_name(func):
    # Get the class object containing the function
    cls = inspect.getmodule(func).__dict__.get(func.__qualname__.split('.<locals>', 1)[0].rsplit('.', 1)[0])
    return cls.__name__ if cls else None

'''
Description: <Takes in a function and returns the source file>
Input: A function
Output: Path to source file with definition of method
Eg: 
>> test= test() // A class with a method mymethod
>> f = test.mymethod() // Calling the method
>> get_source_file(f) // will return name of the file
'''
def get_source_file(func):
    return inspect.getsourcefile(func)

'''
Description: <Put around a method to add a logging record>
Input: A function we want to monitor in the logs.txt
Output: Adds log info into the logs.txt
Eg: 
#In file test.py
from LogClass import LogMessage
@LogMessage
def mymethod(x):
    return 2*x

In the logs.txt:
==============================================================================
Date-time: <Month> <Day> <Year>, <Hour>:<Minute>:<Second>
Function: mymethod
Input variables for mymethod: ['x']
From Class None 
From file path to test.py
==============================================================================
'''
def LogMessage(func):
    SEP = '\n==============================================================================\n'
    dateinfo = datetime.now().strftime("%B %d %Y, %H:%M:%S")
    s = root_directory_path() + '\\logs.txt'
    if(os.path.exists(s)):
        f = open(s, 'a')
    else:
        f = open(s, 'x')
    f.write(SEP)
    f.write(f'Date-time: {dateinfo}')
    f.write(f'\nFunction: {func.__name__}')
    argspec = inspect.getfullargspec(func)
    f.write(f'\nInput variables for {func.__name__}: {argspec.args}')
    class_func = get_class_name(func)
    f.write(f'\nFrom Class {class_func}')
    f.write(f'\nFrom file {get_source_file(func)}')
    def inner(*args, **kwargs):
        try:
            var = func(*args, **kwargs)
        except Exception as e:
            raise e
        return var
    inner.__name__ = func.__name__
    return inner