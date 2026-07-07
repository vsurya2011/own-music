package com.hibernate.repository.impl;

import java.time.LocalDate;
import java.util.List;

import org.hibernate.Session;
import org.hibernate.Transaction;

import com.hibernate.entity.Student;
import com.hibernate.repository.StudentRepository;
import com.hibernate.util.HibernateUtil;

public class StudentRepositoryImpl implements StudentRepository {

    @Override
    public void save(Student student) {

        Transaction transaction = null;

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {

            transaction = session.beginTransaction();

            session.persist(student);

            transaction.commit();

        } catch (Exception e) {

            if (transaction != null) {
                transaction.rollback();
            }

            throw e;
        }
    }

    @Override
    public Student findById(int id) {

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {

            return session.get(Student.class, id);

        }
    }

    @Override
    public void update(Student student) {

        Transaction transaction = null;

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {

            transaction = session.beginTransaction();

            session.merge(student);

            transaction.commit();

        } catch (Exception e) {

            if (transaction != null) {
                transaction.rollback();
            }

            throw e;
        }

    }

    @Override
    public void delete(int id) {

        Transaction transaction = null;

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {

            transaction = session.beginTransaction();

            Student student = session.get(Student.class, id);

            if (student != null) {
                session.remove(student);
            }

            transaction.commit();

        } catch (Exception e) {

            if (transaction != null) {
                transaction.rollback();
            }

            throw e;
        }

    }

    @Override
    public List<Student> findAll() {

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {

            return session.createQuery("FROM Student", Student.class)
                    .getResultList();

        }

    }

    @Override
    public Student getStudentByEmailAndDate(String email, LocalDate date) {

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {

            String hql = """
                    FROM Student
                    WHERE emailId = :email
                    AND enrollmentDate = :date
                    """;

            return session.createQuery(hql, Student.class)
                    .setParameter("email", email)
                    .setParameter("date", date)
                    .uniqueResult();

        }

    }

}