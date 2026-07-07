package com.hibernate.service;

import java.time.LocalDate;

import com.hibernate.entity.Student;

public interface StudentService {

    void addStudent(Student student) throws Exception;

    Student getStudentById(int id) throws Exception;

    void updateStudentCourse(int id, String courseName, String grade) throws Exception;

    void deleteStudent(int id) throws Exception;

    void getAllStudents() throws Exception;

    Student getStudentByEmailAndDate(String email, LocalDate date) throws Exception;

}