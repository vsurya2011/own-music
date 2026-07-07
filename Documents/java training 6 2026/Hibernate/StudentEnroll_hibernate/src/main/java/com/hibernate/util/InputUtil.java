package com.hibernate.util;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Scanner;

public class InputUtil {

    private static final Scanner sc = new Scanner(System.in);

    private InputUtil() {
    }

    public static int getInt(String message) {
        System.out.print(message);
        int value = sc.nextInt();
        sc.nextLine();
        return value;
    }

    public static String getString(String message) {
        System.out.print(message);
        return sc.nextLine();
    }

    public static LocalDate getDate(String message) {

        System.out.print(message);

        String input = sc.nextLine();

        DateTimeFormatter formatter =
                DateTimeFormatter.ofPattern("dd-MM-yyyy");

        return LocalDate.parse(input, formatter);

    }

    public static void closeScanner() {
        sc.close();
    }

}
