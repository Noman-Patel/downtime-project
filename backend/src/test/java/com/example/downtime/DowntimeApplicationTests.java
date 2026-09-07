package com.example.downtime;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "app.security.bootstrap.enabled=false")
class DowntimeApplicationTests {

	@Test
	void contextLoads() {
	}

}
