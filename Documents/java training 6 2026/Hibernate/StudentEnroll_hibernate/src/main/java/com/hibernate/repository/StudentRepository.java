package com.hibernate.repository;

import java.time.LocalDate;
import java.util.List;

import com.hibernate.entity.Student;

public interface StudentRepository {

    void save(Student student);

    Student findById(int id);

    void update(Student student);

    void delete(int id);

    List<Student> findAll();

    Student getStudentByEmailAndDate(String email, LocalDate date);

}