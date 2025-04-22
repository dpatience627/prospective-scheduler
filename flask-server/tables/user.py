from app import db

class User(db.Model):
    __tablename__ = 'Users'
    UserID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Email = db.Column(db.Unicode, nullable=False)
    UserPriveleges = db.Column(db.Integer, nullable=False)
    FirstName = db.Column(db.Unicode, nullable=False)
    LastName = db.Column(db.Unicode, nullable=False)
    MiddleInitial = db.Column(db.Unicode, nullable=False)

    def UserPrivelegesString(self):
        if self.UserPriveleges == 0:
            return "Base User"
        else:
            return "Admin User"

    def to_json(self) -> str:
        return {
            "UserID": self.UserID,
            "Email": self.Email,
            "UserPriveleges": self.UserPrivelegesString(),
            "FirstName": self.FirstName,
            "LastName": self.LastName,
            "MiddleInitial": self.MiddleInitial
        }
    
    @staticmethod
    def from_json(json):
        return User(
            Email = json["Email"],
            UserPriveleges = int(json["UserPriveleges"]),
            FirstName = json["FirstName"],
            LastName = json["LastName"],
            MiddleInitial = json["MiddleInitial"]
        )