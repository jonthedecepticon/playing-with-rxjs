import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { Course } from '../model/course';
import { createHttpObservable } from './util';
import { map, tap, filter } from 'rxjs/operators';
import { fromPromise } from 'rxjs/internal-compatibility';

@Injectable({
    providedIn: 'root'
})
export class Store {
    
    private subject = new BehaviorSubject<Course[]>([]);
    courses$: Observable<Course[]> = this.subject.asObservable();

    init(){
        const http$ = createHttpObservable('/api/courses');
        
        http$.pipe(
                tap(() => console.log("HTTP request executed")),
                map(res => Object.values(res["payload"]))
            ).subscribe(
                    (courses: Course[]) => this.subject.next(courses)
                );
    }

    selectBeginnerCourses() {
        return this.filterByCategory('BEGINNER');
    }

    selectAdvancedCourses() {
        return this.filterByCategory('ADVANCED');
    }

    selectCourseById(id: number) {
        return this.courses$.pipe(
            map(courses => courses.find(course => course.id == id)),
            // filters out undefined if store is empty
            filter(course => !!course)
        );
    }

    filterByCategory(category: string) {
        return this.courses$.pipe(
            map(courses => courses
                .filter(course => course.category == category))
        );
    }

    saveCourse(id: number, changes): Observable<any> {
        const courses = this.subject.getValue();
        const courseIndex = courses.findIndex(course => course.id === id);
        
        const newCourses = courses.slice(0);
        newCourses[courseIndex] = {
            ...courses[courseIndex],
            ...changes
        }
        this.subject.next(newCourses);

        return fromPromise(fetch(`/api/courses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(changes),
            headers: {
                'content-type': "application/json"
            }
        }));
    }

}