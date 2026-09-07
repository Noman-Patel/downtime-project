package com.example.downtime.Config;

import com.example.downtime.Entities.AppUser;
import com.example.downtime.Entities.Role;
import com.example.downtime.Repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LocalUserInitializerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private LocalUserInitializer initializer;

    @BeforeEach
    void setUp() {
        initializer = new LocalUserInitializer(
                userRepository,
                passwordEncoder,
                "Admin123!",
                "Tech123!"
        );
    }

    @Test
    void addsAdministratorAndTechnicianOnlyWhenUserTableIsEmpty() {
        when(passwordEncoder.encode("Admin123!")).thenReturn("admin-hash");
        when(passwordEncoder.encode("Tech123!")).thenReturn("tech-hash");

        initializer.run(null);

        ArgumentCaptor<AppUser> users = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository, times(2)).save(users.capture());

        List<AppUser> savedUsers = users.getAllValues();
        assertEquals(List.of("admin", "technician"), savedUsers.stream()
                .map(AppUser::getUsername)
                .toList());
        assertEquals(List.of(Role.ADMIN, Role.TECHNICIAN), savedUsers.stream()
                .map(AppUser::getRole)
                .toList());
        assertTrue(savedUsers.stream().allMatch(AppUser::isEnabled));
        assertEquals("admin-hash", savedUsers.getFirst().getPasswordHash());
        assertEquals("tech-hash", savedUsers.getLast().getPasswordHash());
    }

    @Test
    void preservesExistingUsersWithoutAddingPartialStarterAccounts() {
        when(userRepository.count()).thenReturn(1L);

        initializer.run(null);

        verify(userRepository, never()).save(any(AppUser.class));
        verify(passwordEncoder, never()).encode(any());
    }
}
