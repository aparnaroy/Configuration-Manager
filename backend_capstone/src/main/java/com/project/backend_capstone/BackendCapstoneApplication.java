package com.project.backend_capstone;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
public class BackendCapstoneApplication {
	public static void main(String[] args) {
		Dotenv dotenv = Dotenv.configure()
				.directory("./backend_capstone")
				.load();

		// Get AWS secret info from .env file
		dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));

		SpringApplication.run(BackendCapstoneApplication.class, args);
	}
}
