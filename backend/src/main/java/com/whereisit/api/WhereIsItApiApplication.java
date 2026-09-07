package com.whereisit.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class WhereIsItApiApplication {

	public static void main(String[] args) {
		loadDotEnv();
		SpringApplication.run(WhereIsItApiApplication.class, args);
	}

	private static void loadDotEnv() {
		try {
			java.io.File file = new java.io.File("../.env");
			if (!file.exists()) {
				file = new java.io.File(".env");
			}
			if (file.exists()) {
				java.nio.file.Files.lines(file.toPath()).forEach(line -> {
					line = line.trim();
					if (!line.isEmpty() && !line.startsWith("#") && line.contains("=")) {
						int eqIdx = line.indexOf("=");
						String key = line.substring(0, eqIdx).trim();
						String value = line.substring(eqIdx + 1).trim();
						// Remove enclosing quotes if any
						if (value.startsWith("\"") && value.endsWith("\"") && value.length() >= 2) {
							value = value.substring(1, value.length() - 1);
						} else if (value.startsWith("'") && value.endsWith("'") && value.length() >= 2) {
							value = value.substring(1, value.length() - 1);
						}
						if (System.getProperty(key) == null && System.getenv(key) == null) {
							System.setProperty(key, value);
						}
					}
				});
				System.out.println("Successfully loaded environment variables from .env");
			}
		} catch (Exception e) {
			System.err.println("Could not load .env file: " + e.getMessage());
		}
	}

}
