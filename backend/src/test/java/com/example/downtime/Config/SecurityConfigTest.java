package com.example.downtime.Config;

import com.example.downtime.Controller.AuthController;
import com.example.downtime.Controller.DashboardController;
import com.example.downtime.Controller.DowntimeEventController;
import com.example.downtime.Controller.MachineController;
import com.example.downtime.Controller.UserController;
import com.example.downtime.DTO.UserDTO;
import com.example.downtime.Entities.Role;
import com.example.downtime.Service.DashboardService;
import com.example.downtime.Service.DowntimeEventService;
import com.example.downtime.Service.MachineService;
import com.example.downtime.Service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

@WebMvcTest(controllers = {
        AuthController.class,
        DashboardController.class,
        DowntimeEventController.class,
        MachineController.class,
        UserController.class
})
@Import(SecurityConfig.class)
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private DashboardService dashboardService;

    @MockitoBean
    private DowntimeEventService downtimeEventService;

    @MockitoBean
    private MachineService machineService;

    @Test
    void csrfEndpointIsPublicAndReturnsTokenContract() throws Exception {
        // Spring Security's MockMvc test support swaps in its own CSRF
        // repository so request post-processors such as with(csrf()) work.
        // The real CookieCsrfTokenRepository contract is covered by the
        // application-level HTTP smoke test.
        mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.headerName").isNotEmpty())
                .andExpect(jsonPath("$.parameterName").isNotEmpty());
    }

    @Test
    void unauthenticatedApiRequestReturnsJsonUnauthorizedResponse() throws Exception {
        mockMvc.perform(get("/api/dashboard/summary"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Authentication is required"));
    }

    @Test
    void loginCreatesAnAuthenticatedSessionWithoutExposingPasswordData() throws Exception {
        String encodedPassword = passwordEncoder.encode("Admin123!");
        when(userService.loadUserByUsername("admin")).thenReturn(
                User.withUsername("admin")
                        .password(encodedPassword)
                        .roles("ADMIN")
                        .build()
        );
        when(userService.getCurrentUser("admin")).thenReturn(new UserDTO(
                1L,
                "admin",
                "System Administrator",
                Role.ADMIN,
                true,
                LocalDateTime.of(2026, 9, 6, 12, 0)
        ));

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "admin",
                                  "password": "Admin123!"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andReturn();

        MockHttpSession session = (MockHttpSession) loginResult.getRequest().getSession(false);
        assertNotNull(session);

        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("System Administrator"));

        mockMvc.perform(post("/api/auth/logout")
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    void invalidCredentialsReturnSanitizedJsonUnauthorizedResponse() throws Exception {
        when(userService.loadUserByUsername("admin")).thenReturn(
                User.withUsername("admin")
                        .password(passwordEncoder.encode("Admin123!"))
                        .roles("ADMIN")
                        .build()
        );

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "admin",
                                  "password": "wrong-password"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Invalid username or password"));
    }

    @Test
    void technicianCanReadDashboardAndRecordDowntime() throws Exception {
        mockMvc.perform(get("/api/dashboard/summary")
                        .with(user("technician").roles("TECHNICIAN")))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/downtime-events")
                        .with(user("technician").roles("TECHNICIAN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "machineId": 1,
                                  "faultReason": "Motor overload",
                                  "occurredAt": "2026-09-06T07:00:00"
                                }
                                """))
                .andExpect(status().isOk());
    }

    @Test
    void technicianCannotChangePlantSetupOrDeleteDowntimeHistory() throws Exception {
        mockMvc.perform(post("/api/machines")
                        .with(user("technician").roles("TECHNICIAN"))
                        .with(csrf()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        mockMvc.perform(delete("/api/downtime-events/12")
                        .with(user("technician").roles("TECHNICIAN"))
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void administratorCanManageUsersPlantSetupAndDowntimeHistory() throws Exception {
        mockMvc.perform(get("/api/users")
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/machines")
                        .with(user("admin").roles("ADMIN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/downtime-events/12")
                        .with(user("admin").roles("ADMIN"))
                        .with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    void mutationWithoutCsrfTokenIsRejected() throws Exception {
        mockMvc.perform(post("/api/machines")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

}
