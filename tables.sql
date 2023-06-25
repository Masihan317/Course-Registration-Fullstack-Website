CREATE TABLE "classes" (
	"code"	TEXT,
	"dept"	TEXT,
	"name"	TEXT NOT NULL,
	"capacity"	INTEGER DEFAULT 100,
	"enrollment"	INTEGER DEFAULT 0,
	"description"	TEXT NOT NULL,
	"prereqs"	TEXT,
	"schedule"	TEXT NOT NULL,
	"credits"	INTEGER NOT NULL DEFAULT 5,
	"major"	INTEGER NOT NULL DEFAULT 'N',
	PRIMARY KEY("code")
);

CREATE TABLE "users" (
	"usrname"	TEXT,
	"pwd"	TEXT NOT NULL,
	"nickname"	TEXT NOT NULL,
	"major"	TEXT,
	"classes"	TEXT,
	"session"	TEXT,
	PRIMARY KEY("usrname")
);

CREATE TABLE "cart" (
	"id"	INTEGER,
	"usrname"	TEXT,
	"class_code"	TEXT,
	FOREIGN KEY("class_code") REFERENCES "classes"("code"),
	FOREIGN KEY("usrname") REFERENCES "users"("usrname"),
	PRIMARY KEY("id" AUTOINCREMENT)
);

CREATE TABLE "enrollments" (
	"id"	INTEGER,
	"usrname"	TEXT,
	"class_code"	TEXT,
	FOREIGN KEY("class_code") REFERENCES "classes"("code"),
	FOREIGN KEY("usrname") REFERENCES "users"("usrname"),
	PRIMARY KEY("id" AUTOINCREMENT)
);

CREATE TABLE "transactions" (
	"id"	INTEGER,
	"user"	TEXT,
	"notes"	TEXT,
	"date"	TEXT DEFAULT (datetime('now', 'localtime')),
	FOREIGN KEY("user") REFERENCES "users"("usrname"),
	PRIMARY KEY("id" AUTOINCREMENT)
);