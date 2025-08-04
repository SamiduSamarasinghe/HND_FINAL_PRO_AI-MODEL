import mysql.connector

class MySqlConnector:

    _instance =None

    def __new__(cls):
        if(cls._instance == None):
            cls._instance = super(MySqlConnector,cls).__new__(cls)
        return cls._instance
            

    def __init__(self):
        if not (hasattr(self, 'mySqlObject')): #stop reinnitilzing
            self.mySqlObject = None
            try:

                self.mySqlObject = mysql.connector.connect(
                    host ="localhost",
                    username ="root",
                    password = ""
                )
                print("Connection succssful")
            except Error as error:
                print("Error Connectionn to DB : "+error)

    def get_connection(self):
        return self.mySqlObject