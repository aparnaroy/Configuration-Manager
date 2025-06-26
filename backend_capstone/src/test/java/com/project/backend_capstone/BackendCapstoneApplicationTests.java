package com.project.backend_capstone;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import io.github.cdimascio.dotenv.Dotenv;

@SpringBootTest
class BackendCapstoneApplicationTests {

	@BeforeAll
    static void setUp() {
        Dotenv dotenv = Dotenv.configure().load();
		dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));


	}

	@Test
	void contextLoads() {
	}

}
