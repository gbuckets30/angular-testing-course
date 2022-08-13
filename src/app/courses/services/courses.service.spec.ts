import { HttpErrorResponse } from "@angular/common/http";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { COURSES, findLessonsForCourse } from "../../../../server/db-data";
import { Course } from "../model/course";
import { CoursesService } from "./courses.service"

describe('CoursesService', () => {

    let courses: CoursesService,
        httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [CoursesService],
        })

        courses = TestBed.inject(CoursesService);
        httpTestingController = TestBed.inject(HttpTestingController);
    })

    it("should find all courses", () => {
        courses.findAllCourses().subscribe((courses) => {
            expect(courses).toBeTruthy();
            expect(courses.length).toBe(12, 'Incorrect number of courses');
            const course = courses.find(course => course.id === 12);
            expect(course.titles.description).toBe("Angular Testing Course");
        })

        const req = httpTestingController.expectOne('/api/courses');
        expect(req.request.method).toEqual("GET");
        req.flush({payload: Object.values(COURSES)});
    })

    it("should find a course by ID", () => {
        courses.findCourseById(12).subscribe((course) => {
            expect(course).toBeTruthy();
            expect(course.id).toBe(12);
        })

        const req = httpTestingController.expectOne('/api/courses/12');
        expect(req.request.method).toEqual("GET");
        req.flush(COURSES[12]);
    })

    it("should save the course data", () => {
        const changes: Partial<Course> = {titles: {description: "Testing Course"}};
        courses.saveCourse(12, changes).subscribe((course) => {
            expect(course).toBeTruthy();
            expect(course.id).toBe(12);
            expect(course.titles.description).toEqual(changes.titles.description);
        })

        const req = httpTestingController.expectOne('/api/courses/12');
        expect(req.request.method).toEqual("PUT");
        req.flush({...COURSES[12], ...changes});
    })

    it("should throw an error if save course fails", () => {
        const changes: Partial<Course> = {titles: {description: "Testing Course"}};
        courses.saveCourse(12, changes).subscribe(
            (course) => fail("The save course operation should have failed"),
            (error: HttpErrorResponse) => expect(error.status).toBe(500)
        )

        const req = httpTestingController.expectOne('/api/courses/12');
        expect(req.request.method).toEqual("PUT");
        req.flush('Save course failed', {
            status: 500,
            statusText: 'Internal Server Error'
        })
    })

    it("should find a list of lessons", () => {
        courses.findLessons(12).subscribe((lessons) => {
            expect(lessons).toBeTruthy();
            expect(lessons.length).toBe(3);
        })

        const req = httpTestingController.expectOne(req => req.url === '/api/lessons');
        expect(req.request.method).toEqual("GET");
        expect(req.request.params.get('courseId')).toEqual("12");
        expect(req.request.params.get('filter')).toEqual("");
        expect(req.request.params.get('sortOrder')).toEqual("asc");
        expect(req.request.params.get('pageNumber')).toEqual("0");
        expect(req.request.params.get('pageSize')).toEqual("3");

        req.flush({
            payload: findLessonsForCourse(12).slice(0, 3)
        })
    })

    afterEach(() => {
        httpTestingController.verify(); // makes sure no other HTTP requests except ones specified using expectOne are made
    })
})