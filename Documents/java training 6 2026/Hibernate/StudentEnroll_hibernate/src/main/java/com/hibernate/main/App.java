package com.hibernate.main;

import java.time.LocalDate;

import com.hibernate.entity.Student;
import com.hibernate.enums.CourseType;
import com.hibernate.enums.Gender;
import com.hibernate.enums.Grade;
import com.hibernate.service.StudentService;
import com.hibernate.service.Impl.StudentServiceImpl;
import com.hibernate.util.InputUtil;

public class App {

    public static void main(String[] args) {
        StudentService service = new StudentServiceImpl();
        while (true) {
            System.out.println("\n========== STUDENT ENROLLMENT SYSTEM ==========");

            System.out.println("1. Add Student");
            System.out.println("2. Fetch Student By ID");
            System.out.println("3. Update Course Details");
            System.out.println("4. Delete Student");
            System.out.println("5. Fetch All Students");
            System.out.println("6. Fetch Student By Email + Enrollment Date");
            System.out.println("7. Exit");

            int choice = InputUtil.getInt("\nEnter Choice : ");
            try {
                switch (choice) {
                    case 1:
                        Student student = new Student();
                        student.setFirstName(InputUtil.getString("First Name : "));
                        student.setLastName(InputUtil.getString("Last Name : "));
                        student.setGender(Gender.valueOf(InputUtil.getString("Gender (MALE/FEMALE): ").toUpperCase()));
                        student.setCity(InputUtil.getString("City : "));
                        student.setState(InputUtil.getString("State : "));
                        student.setMobileNumber(InputUtil.getString("Mobile Number : "));
                        student.setEmailId(InputUtil.getString("Email ID : "));
                        student.setCourseId(InputUtil.getInt("Course ID : "));
                        student.setCourseName(InputUtil.getString("Course Name : "));
                        student.setEnrollmentDate(InputUtil.getDate("Enrollment Date (dd-MM-yyyy): "));
                        student.setCourseType(CourseType.valueOf(InputUtil.getString("Course Type (ONLINE/OFFLINE): ").toUpperCase()));
                        student.setGrade(Grade.valueOf(InputUtil.getString("Grade (A/B/C/D/F): ").toUpperCase()));
                        service.addStudent(student);
                        break;
                    case 2:
                        int id = InputUtil.getInt("Enter Student ID : ");
                        Student student1 = service.getStudentById(id);
                        System.out.println(student1);
                        break;
                    case 3:
                        int updateId = InputUtil.getInt("Student ID : ");
                        String courseName = InputUtil.getString("New Course Name : ");
                        String grade = InputUtil.getString("New Grade : ");
                        service.updateStudentCourse(updateId, courseName, grade);
                        break;
                    case 4:
                        int deleteId = InputUtil.getInt("Student ID : ");
                        service.deleteStudent(deleteId);
                        break;
                    case 5:
                        service.getAllStudents();
                        break;
                    case 6:
                        String email = InputUtil.getString("Email ID : ");
                        LocalDate date = InputUtil.getDate("Enrollment Date (dd-MM-yyyy): ");
                        Student student2 = service.getStudentByEmailAndDate(email, date);
                        System.out.println(student2);
                        break;
                    case 7:
                        System.out.println("Exiting...");
                        return;
                    default:
                        System.out.println("Invalid Choice.");
                }
            } catch (Exception e) {

                System.out.println(e.getMessage());
            }
        }
    }
}