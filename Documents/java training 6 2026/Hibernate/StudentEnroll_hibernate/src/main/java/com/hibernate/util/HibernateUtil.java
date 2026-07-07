package com.hibernate.util;

import org.hibernate.SessionFactory;
import org.hibernate.cfg.Configuration;

import com.hibernate.entity.Student;

public class HibernateUtil {

    private static SessionFactory sessionFactory;

    static {

        try {

            Configuration configuration = new Configuration();

            configuration.addAnnotatedClass(Student.class);

            sessionFactory = configuration.buildSessionFactory();

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("SessionFactory creation failed.");
        }

    }

    private HibernateUtil() {
    }
    public static SessionFactory getSessionFactory() {
        return sessionFactory;
    }

}