from os.path import realpath, dirname

def root_directory_path() -> str:
    return dirname(dirname(realpath(__file__)))
