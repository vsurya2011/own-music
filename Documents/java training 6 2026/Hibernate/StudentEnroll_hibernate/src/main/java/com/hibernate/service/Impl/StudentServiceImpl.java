package com.hibernate.service.Impl;

import java.time.LocalDate;
import java.util.List;

import com.hibernate.entity.Student;
import com.hibernate.enums.Grade;
import com.hibernate.exception.DuplicateStudentException;
import com.hibernate.exception.StudentNotFoundException;
import com.hibernate.repository.StudentRepository;
import com.hibernate.repository.impl.StudentRepositoryImpl;
import com.hibernate.service.StudentService;

public class StudentServiceImpl implements StudentService {

    private final StudentRepository repository = new StudentRepositoryImpl();

    @Override
    public void addStudent(Student student) throws Exception {

        Student existingStudent =
                repository.getStudentByEmailAndDate(
                        student.getEmailId(),
                        student.getEnrollmentDate());

        if (existingStudent != null) {
            throw new DuplicateStudentException(
                    "Student already exists with Email ID : "
                            + student.getEmailId());
        }

        repository.save(student);

        System.out.println("Student Added Successfully.");

    }

    @Override
    public Student getStudentById(int id) throws Exception {

        Student student = repository.findById(id);

        if (student == null) {
            throw new StudentNotFoundException(
                    "Student Not Found with ID : " + id);
        }

        return student;

    }

    @Override
    public void updateStudentCourse(int id,
                                    String courseName,
                                    String grade) throws Exception {

        Student student = repository.findById(id);

        if (student == null) {
            throw new StudentNotFoundException(
                    "Student Not Found.");
        }

        student.setCourseName(courseName);
        student.setGrade(Grade.valueOf(grade.toUpperCase()));

        repository.update(student);

        System.out.println("Student Updated Successfully.");

    }

    @Override
    public void deleteStudent(int id) throws Exception {

        Student student = repository.findById(id);

        if (student == null) {
            throw new StudentNotFoundException(
                    "Student Not Found.");
        }

        repository.delete(id);

        System.out.println("Student Deleted Successfully.");

    }

    @Override
    public void getAllStudents() throws Exception {

        List<Student> students = repository.findAll();

        if (students.isEmpty()) {

            System.out.println("No Students Found.");

            return;
        }

        for (Student student : students) {

            System.out.println(student);

            System.out.println("---------------------------------------");

        }

    }

    @Override
    public Student getStudentByEmailAndDate(String email,
                                            LocalDate date)
            throws Exception {

        Student student =
                repository.getStudentByEmailAndDate(email, date);

        if (student == null) {

            throw new StudentNotFoundException(
                    "Student Not Found.");

        }

        return student;

    }

}