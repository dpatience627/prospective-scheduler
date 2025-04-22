import { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { FLASK_BASE_URL } from "../envVariables"; 
import equal from "fast-deep-equal/es6/react";
import axios from 'axios';
import { pca } from "index";
import { CacheLookupPolicy } from "@azure/msal-browser"

let cachedIdToken = null;

export async function studentFileUpload(file){
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${FLASK_BASE_URL}/api/v1/student/file/`, formData).catch((reason) => {console.log(reason); return reason});
    if(response.name == "AxiosError"){
        response.error = true;
        return response;
    }
    else{
        return response.data;
    } 
}

async function getIDToken() {
    //Check if the current token is valid
    const isValid = await isIDTokenValid(cachedIdToken);

    //If it isn't, get a new one which is
    if(!isValid) {
        const accessTokenRequest = {
            scopes: ["user.read"],
            account: pca.getAllAccounts()[0],
            cacheLookupPolicy: CacheLookupPolicy.RefreshTokenAndNetwork
        };
        cachedIdToken = (await pca.acquireTokenSilent(accessTokenRequest)).idToken; 
    }
    
    //Return the valid token
    return cachedIdToken;
}

async function authorizedFetch({url, method="POST", body={}}) {
    //Attach IdToken to request
    body.IdToken = await getIDToken();

    //Construct and send request
    const request = {
        method: method,
        headers: {
            "content-type": "application/json"
        }
    }
    if(method !== "GET") {
        request.body = JSON.stringify(body)
    }

    const data = await fetch(url, request);
    const json = await data.json();

    if(json.error) {
        console.log(`[API ERROR] - ${json.error}`);
    }

    //Return response
    return json;
}

async function isIDTokenValid(idToken) {
    const response = await fetch(`${FLASK_BASE_URL}/api/v1/validate-id-token/`, {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify({
            IdToken: idToken
        })
    });
    const json = await response.json();
    if(json.error) {
        return false;
    }
    return true; 
}

export async function getPermissions(email) {
    const response = await fetch(`${FLASK_BASE_URL}/api/v1/user/getPermissions/`, {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify({
            email: email,
        })
    });
    const json = await response.json();
    if(json.error) {
        return false;
    }
    return json.permissions;
}

export async function getUsers() {
    const json = await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/users/`
    });
    return json.users;
}

export async function getUser(userID) {
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/user/${userID}/`
    });
}

export async function addUser(email, userPriveleges, firstName, lastName, middleInitial) {
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/user/add/`,
        body: {
            Email: email.toUpperCase(),
            UserPriveleges: userPriveleges,
            FirstName: firstName,
            LastName: lastName,
            MiddleInitial: middleInitial
        }
    });
}

export async function editUser(userID, email, userPriveleges, firstName, lastName, middleInitial) {
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/user/edit/`,
        body: {
            UserID: userID,
            Email: email.toUpperCase(),
            UserPriveleges: userPriveleges,
            FirstName: firstName,
            LastName: lastName,
            MiddleInitial: middleInitial
        }
    });
}

export async function deleteUser(id) {
    await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/user/delete/${id}/`,
        method: "DELETE"
    });
}

export const VISIT_STATUS_NO_EVENTS = 0;
export const VISIT_STATUS_PENDING = 1;
export const VISIT_STATUS_DECLINED = 2;
export const VISIT_STATUS_COMPLETE = 3;

export async function getVisits(includePastVisits) {
    const json = await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/visits/`,
        body: {
            includePastVisits: includePastVisits
        }
    })
    return json.visits;
}

export async function getFutureVisits() { return getVisits(false); }
export async function getAllVisits() { return getVisits(true); }

export async function getVisit(id) {
    const json = await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/visit/get/${id}/`
    });
    return json;
}

export async function addVisit(visit) {
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/visit/add/`,
        body: {
            VisitDate: visit.VisitDate,
            StartTime: visit.StartTime,
            EndTime: visit.EndTime,
            StudentFirstName: visit.StudentFirstName,
            StudentLastName: visit.StudentLastName,
            StudentMiddleInitial: visit.StudentMiddleInitial,
            IntendedMajorID: visit.IntendedMajorID,
            CreatedByUserID: visit.CreatedByUserID
        }
    });
}

export async function deleteVisit(id) {
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/visit/delete/${id}/`,
        method: "DELETE"
    });
}

export async function addEventsToVisit(candidateSchedule, visitID) {
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/visit/events/add/${visitID}/`,
        body: {
            candidateSchedule: candidateSchedule
        }
    });
}

export async function cancelFacultyVisit(facultyVisitID) {
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/visit/events/cancel/faculty/${facultyVisitID}/`,
        method: "DELETE"
    });
}

export async function cancelClassVisit(classVisitID) {
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/visit/events/cancel/class/${classVisitID}/`,
        method: "DELETE"
    });
}

export async function cancelStudentLunch(studentVisitID) {
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/visit/events/cancel/student/${studentVisitID}/`,
        method: "DELETE"
    });
}

export async function resendFacultyVisitInvite(facultyVisitID) {
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/visit/events/resend-invite/faculty/${facultyVisitID}/`
    });
}

export async function resendStudentVisitInvite(studentVisitID) {
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/visit/events/resend-invite/student/${studentVisitID}/`
    });
}

export async function resendClassVisitInvite(classVisitID) {
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/visit/events/resend-invite/class/${classVisitID}/`
    });
}

export async function getNoShowSurvey(surveyID) {
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/visit/noshow-survey/${surveyID}/`,
        method: "GET"
    })
}

export async function respondToNoShowSurvey(surveyID, wasNoShow) {
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/visit/noshow-survey/respond/${surveyID}/`,
        body : {
            wasNoShow: wasNoShow
        }
    })
}

export async function getClasses() {
    const json = await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/classes/`
    })
    return json.classes;
}

export async function getClass(classID) {
    const json = await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/class/${classID}`
    })
    return json.classes;
}

export async function getStudents() {
    const json = await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/students/`
    })
    return json.students;
}

export async function getStudent(id) {
    const json = await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/student/get/${id}/`
    });
    return json;
}

export async function addStudent(email, fname, lname, middleInitial, majorID) {
    await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/student/add/`,
        body: {
            Email: email,
            FirstName: fname,
            LastName: lname,
            MiddleInitial: middleInitial,
            PursuingMajorID: majorID
        }
    })
}

export async function editStudent(studentID, student) {
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/student/edit/`,
        body: {
            StudentID: studentID,
            Email: student.email,
            FirstName: student.firstName,
            LastName: student.lastName,
            MiddleInitial: student.middleInitial,
            PursuingMajorID: student.majorID
        }
    });
}

export async function deleteStudent(id) {
    await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/student/delete/${id}/`,
        method: "DELETE"
    });
}

export async function getStudentEmails() {
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/students/emails/`
    })
}

export async function getGccEmails() {
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/gcc/emails/`
    })
}

export async function addClass(clazz) {
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/class/add/`,
        body: {
            InBuilding: clazz.InBuilding,
            InRoomNumber: clazz.InRoomNumber,
            YearIn: clazz.YearIn,
            Semester: clazz.Semester,
            CourseNo: clazz.CourseNo,
            Section: clazz.Section,
            ClassName: clazz.ClassName,
            BelongsToDeptID: clazz.BelongsToDeptID,
            TaughtByID: clazz.TaughtByID,
            IsOnline: clazz.IsOnline,
            AllowInVisits: clazz.AllowInVisits
        }
    });
}

export async function deleteClass(id) {
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/class/delete/${id}/`,
        method: "DELETE"
    });
}

export async function editClass(editedClass) {
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/class/edit/`,
        body: {
            ClassID: editedClass.ClassID,
            Location: editedClass.Location,
            YearIn: editedClass.YearIn,
            Semester: editedClass.Semester,
            CourseNo: editedClass.CourseNo,
            Section: editedClass.Section,
            ClassName: editedClass.ClassName,
            BelongsToDeptID: editedClass.BelongsToDept.DepartmentID,
            TaughtByID: editedClass.TaughtBy.FacultyID,
            IsOnline: editedClass.IsOnline,
            AllowInVisits: editedClass.AllowInVisits
        }
    });
}

export async function addClassMeetingTime(meetingTime) {
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/class/meetingtime/add/`,
        body: {
            MeetingDays: meetingTime.MeetingDays,
            StartTime: meetingTime.StartTime,
            EndTime: meetingTime.EndTime,
            ForClassID: meetingTime.ForClassID
        }
    });
}

export async function refreshClassesFromMyGCC() {
    const json = await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/classes/refresh/`
    });
    return json.classes;
}

export async function archiveClasses(id) {
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/class/archive/${id}/`
    });
}

export async function getMajors() {
    const json = await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/majors/`
    });
    return json.majors;
}

export async function addMajor(major){
    return await authorizedFetch({
        url:`${FLASK_BASE_URL}/api/v1/major/add/`,
        body: {
            MajorName: major.majorName,
            BelongsToDepartmentID: major.majorDeptID
        }
    })
}

export async function editMajor(majorID, major){
    return await authorizedFetch({
        url:`${FLASK_BASE_URL}/api/v1/major/edit/${majorID}/`,
        body: {
            MajorName: major.majorName,
            BelongsToDepartmentID: major.majorDeptID
        }
    })
}

export async function deleteMajor(id){
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/major/delete/${id}/`,
        method: "DELETE"
    });
}

export async function getDepartments(){
    const json = await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/departments/`
    })
    return json.departments
}

export async function getDepartment(id){
    const json = await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/department/${id}/`
    });
    return json;
}

export async function deleteDepartment(id){
    await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/department/delete/${id}/`,
        method: "DELETE"
    });
}

export async function addDepartment(department){
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/department/add/`,
        body: {
            DepartmentName: department.departmentName,
            DepartmentAbbrev: department.departmentAbbreviation
        }
    });
}

export async function editDepartment(departmentID, department){
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/department/edit/${departmentID}/`,
        body: {
            DepartmentName: department.departmentName,
            DepartmentAbbrev: department.departmentAbbreviation
        }
    });
}
export async function majorsFileUpload(file){
    const formData = new FormData();
    formData.append('file', file);
    const axios_response = await axios.post(`${FLASK_BASE_URL}/api/v1/majors/file/`, formData).catch((reason) => {return reason});
    if(axios_response.name == "AxiosError"){
        return axios_response.response.data
    }
    return axios_response.data;
}
export async function deleteMajorsByDept(deptID){
    console.log(deptID);
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/major/deleteDept/${deptID}/`,
        method: "DELETE"
    })
}

export async function getFaculty(){
    const json = await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/faculty/`
    })
    return json.faculty
}

export async function deleteFaculty(id){
    await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/faculty/delete/${id}/`,
       // method: "DELETE"
    });
}

export async function addFaculty(facultyForm){
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/faculty/add/`,
        body: facultyForm
    })
}


export async function editFaculty(facultyID, facultyForm){
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/faculty/edit/${facultyID}/`,
        body: facultyForm
    })
}

export async function facultyFileUpload(file){
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${FLASK_BASE_URL}/api/v1/faculty/file/`, formData).catch((reason) => {return reason});
    //if its an axios error, return something else
    if(response.name == "AxiosError"){
        response.error = true;
        return response;
    }
    else{
        return response.data;
    }
}

export async function facultyAffectedCourses(ID){
    const json = await authorizedFetch({
       url: `${FLASK_BASE_URL}/api/v1/faculty/affected/${ID}`
    })
    return json.affectedCourses
}

export async function verifyFacultyEmails(){
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/faculty/verify-emails/`
    });
}

export async function getFacultyEmails() {
    return await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/faculty/emails/`
    })
}

// SCHEDULE GENERATION
export async function getCandidateSchedules(visitID, departmentID, classVisitTimeRange, facultyVisitTimeRange, studentLunchTimeRange) {
    const json = await authorizedFetch({
        url: `${FLASK_BASE_URL}/api/v1/generate-schedules/${visitID}/`,
        body: {
            departmentID: departmentID,
            classVisitTimeRange: classVisitTimeRange,
            facultyVisitTimeRange: facultyVisitTimeRange,
            studentLunchTimeRange: studentLunchTimeRange
        }
    });
    return json;
}

//MISC
export async function getUserRoles() {
    return [
        {RoleID: 0, RoleName: "Base User"},
        {RoleID: 1, RoleName: "Admin User"}
    ]
}

export function userRoleToId(role) {
    if(role === "Admin User") {
        return 1;
    }
    return 0;
}

///////////////////////////
// REACT STATE FUNCTIONS //
///////////////////////////

// These functions are used to load / reload information from
// the flask backend in a more concise, testable manner.
// Additionally, extra work has been made to make these methods performant,
// such as caching.

const cache = {}; //A cache of the most recently fetched json from each API function. 
                  //This cache maps function names to json responses.

//Gets the most recently fetched json for the particular API function
//from the cache, or returns the provided default value if the cache is empty
function getOrDefaultFromCache(forFunction, defaultValue) {
    const cached = cache[forFunction.name];
    return cached ? cached : defaultValue;
}

//Sets the most recently fetched json for the particular API function in the cache.
//If the most recently fetched data is not the same as the cached data, this returns true.
//Otherwise, it returns false.
function updateCache(forFunction, value) {
    const oldValue = cache[forFunction.name];

    if(equal(oldValue, value)) {
        return false; //We did not update the cache
    }

    cache[forFunction.name] = value;
    return true; //We did update the cache
}

//A generic state function for user permissions
export const usePermissions = () => {
    const { instance } = useMsal();
    const [permissions, setPermissions] = useState(getOrDefaultFromCache(getPermissions, -1));

    const updatePermissions = (updated) => {
        if(updateCache(getPermissions, updated)) {
            setPermissions(updated);
        }
    }
    
    const loggedInUser = instance.getAllAccounts().at(0);
    useEffect(() => {
        if(!loggedInUser) {
            updatePermissions(-1);
        } else {  
            getPermissions(instance.getAllAccounts().at(0).username).then(updatePermissions);
        }
    }, [loggedInUser]);

    return permissions;
}

//A generic state function for API functions that return lists of items
const useList = (getterFunction, dependencies) => {
    const[list, setList] = useState(getOrDefaultFromCache(getterFunction, []));
    const[loading, setLoading] = useState(true);

    const updateList = (updated) => {
        if(updateCache(getterFunction, updated)) {
            setList(updated);
        }
        setLoading(false);
    }

    const reload = async () => {
        setLoading(true);
        getterFunction().then(updateList);
    }

    useEffect(() => {reload()}, dependencies);

    //A function returned to the user to visually edit
    //a single item in the list.
    const edit = (index, newValue) => {
        const copy = [...list];
        copy[index] = newValue;
        updateList(copy);
    }

    //A function returned to the user to visually remove
    //a single item in the list.
    const remove = (index) => {
        const removed = list.filter((v,i) => {return i !== index;})
        updateList(removed);
    }

    //A function returned to the user to visually add
    //a single item to the list.
    const add = (value) => {
        const added = [...list];
        added.push(value);
        updateList(added);
    }

    return [list, edit, remove, add, loading];
}

export const useUsers = (dependencies) => {
    return useList(getUsers, dependencies);
}

export const useClasses = (dependencies) => {
    const [classes, _edit, _remove, _add, loading] = useList(getClasses, dependencies);

    const remove = (index) => {
        _remove(index)
        deleteClass(classes[index].ClassID);
    }

    const edit = (index, editedClass) => {
        _edit(index, editedClass);
        editClass(editedClass);
    }

    return [classes, edit, remove, loading];
}

export const useVisits = (dependencies) => {
    const [visits, _edit, _remove, _add, loading] = useList(getFutureVisits, dependencies);

    const remove = (index) => {
        _remove(index);
        deleteVisit(visits[index].VisitID);
    }

    const add = async (visit) => {
        const newVisit = await addVisit(visit);
        _add(newVisit);
    }

    const edit = (visit) => {
        const index = visits.findIndex((v) => visit.VisitID === v.VisitID);
        _edit(index, visit);
    }

    return [visits, edit, add, remove, loading];
}

export const useAllVisits = (dependencies) => {
    const [visits, _edit, _remove, _add] = useList(getAllVisits, dependencies);
    return visits;
}

export const useDepartments = (dependencies) => {
    const [depts, _edit, _remove, _add, loading] = useList(getDepartments, dependencies);

    const remove = (index) => {
        _remove(index);
        deleteDepartment(depts[index].DepartmentID);
    }

    const add = async (deptForm) => {
        const newDept = await addDepartment(deptForm);
        _add(newDept);
    }

    const edit = (deptID, deptForm) => {
        editDepartment(deptID, deptForm).then((dept) => {
            const index = depts.findIndex((v) => dept.DepartmentID === v.DepartmentID);
            _edit(index, dept);
        });
    }

    return [depts, edit, remove, add, loading];
}

export const useMajors = (dependencies) => {
    const [majors, _edit, _remove, _add, loading] = useList(getMajors, dependencies);

    const remove = (index) => {
        _remove(index);
        deleteMajor(majors[index].MajorID);
    }

    const add = async (majorForm) => {
        addMajor(majorForm).then(_add);
    }

    const edit = (majorID, majorForm) => {
        editMajor(majorID, majorForm).then((major) => {
            const index = majors.findIndex((v) => major.MajorID === v.MajorID);
            _edit(index, major);
        });
    }

    return [majors, edit, remove, add, loading];
}

export const useFaculty = (dependencies) => {
    const [faculty, _edit, _remove, _add, loading] = useList(getFaculty, dependencies);

    const remove = (index) => {
        _remove(index);
        deleteFaculty(faculty[index].FacultyID);
    }

    const add = async (facForm) => {
        const newFac = await addFaculty(facForm);
        _add(newFac);
    }

    const edit = (facID, facForm) => {
        editFaculty(facID, facForm).then((fac) => {
            const index = faculty.findIndex((f) => fac.FacultyID === f.FacultyID);
            _edit(index, fac);
        });
    }

    return [faculty, edit, remove, add, loading];
}
export const useStudents = (dependencies) => {
    const [students, _edit, _remove, _add, loading] = useList(getStudents, dependencies);

    const remove = (index) => {
        _remove(index);
        deleteStudent(students[index].StudentID);
    }

    const add = async (studentForm) => {
        const newStudent = await addStudent(studentForm);
        _add(newStudent);
    }

    const edit = (studID, studForm) => {
        editStudent(studID, studForm).then((student) => {
            const index = students.findIndex((s) => student.StudentID === s.StudentID);
            _edit(index, student);
        });
    }

    return [students, edit, remove, add, loading];
}