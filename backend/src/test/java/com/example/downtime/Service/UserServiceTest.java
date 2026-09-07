package com.example.downtime.Service;

import com.example.downtime.DTO.CreateUserRequestDTO;
import com.example.downtime.DTO.UpdateUserRequestDTO;
import com.example.downtime.Entities.AppUser;
import com.example.downtime.Entities.Role;
import com.example.downtime.Exception.UserOperationNotAllowedException;
import com.example.downtime.Exception.UsernameAlreadyExistsException;
import com.example.downtime.Repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, passwordEncoder);
    }

    @Test
    void loadsEnabledUserWithRoleForSpringSecurity() {
        AppUser technician = user(
                7L,
                "technician",
                "Demo Technician",
                "encoded-password",
                Role.TECHNICIAN,
                true
        );
        when(userRepository.findByUsernameIgnoreCase("technician"))
                .thenReturn(Optional.of(technician));

        UserDetails details = userService.loadUserByUsername(" Technician ");

        assertEquals("technician", details.getUsername());
        assertEquals("encoded-password", details.getPassword());
        assertTrue(details.isEnabled());
        assertTrue(details.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_TECHNICIAN")));
    }

    @Test
    void createsUserWithNormalizedUsernameAndEncodedPassword() {
        when(userRepository.existsByUsernameIgnoreCase("alex.tech")).thenReturn(false);
        when(passwordEncoder.encode("Secret123!"))
                .thenReturn("encoded-password");
        when(userRepository.save(any(AppUser.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var result = userService.createUser(new CreateUserRequestDTO(
                " Alex.Tech ",
                " Alex Rivera ",
                "Secret123!",
                Role.TECHNICIAN
        ));

        assertEquals("alex.tech", result.username());
        assertEquals("Alex Rivera", result.displayName());
        assertEquals(Role.TECHNICIAN, result.role());
        assertTrue(result.enabled());
        verify(passwordEncoder).encode("Secret123!");
    }

    @Test
    void rejectsDuplicateUsernameWithoutSaving() {
        when(userRepository.existsByUsernameIgnoreCase("admin")).thenReturn(true);

        assertThrows(
                UsernameAlreadyExistsException.class,
                () -> userService.createUser(new CreateUserRequestDTO(
                        "ADMIN",
                        "Another Administrator",
                        "Secret123!",
                        Role.ADMIN
                ))
        );

        verify(userRepository, never()).save(any(AppUser.class));
    }

    @Test
    void blankPasswordOnUpdateKeepsExistingPasswordHash() {
        AppUser technician = user(
                4L,
                "technician",
                "Old Name",
                "existing-hash",
                Role.TECHNICIAN,
                true
        );
        when(userRepository.findById(4L)).thenReturn(Optional.of(technician));
        when(userRepository.save(technician)).thenReturn(technician);

        var result = userService.updateUser(
                4L,
                new UpdateUserRequestDTO(
                        "Updated Technician",
                        Role.TECHNICIAN,
                        true,
                        ""
                ),
                "admin"
        );

        assertEquals("Updated Technician", result.displayName());
        assertEquals("existing-hash", technician.getPasswordHash());
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void signedInAdministratorCannotDisableOwnAccount() {
        AppUser admin = user(
                1L,
                "admin",
                "System Administrator",
                "hash",
                Role.ADMIN,
                true
        );
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));

        assertThrows(
                UserOperationNotAllowedException.class,
                () -> userService.updateUser(
                        1L,
                        new UpdateUserRequestDTO(
                                "System Administrator",
                                Role.ADMIN,
                                false,
                                null
                        ),
                        "admin"
                )
        );

        verify(userRepository, never()).save(any(AppUser.class));
    }

    @Test
    void finalEnabledAdministratorCannotBeDemoted() {
        AppUser admin = user(
                1L,
                "admin",
                "System Administrator",
                "hash",
                Role.ADMIN,
                true
        );
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(userRepository.countByRoleAndEnabledTrue(Role.ADMIN)).thenReturn(1L);

        assertThrows(
                UserOperationNotAllowedException.class,
                () -> userService.updateUser(
                        1L,
                        new UpdateUserRequestDTO(
                                "System Administrator",
                                Role.TECHNICIAN,
                                true,
                                null
                        ),
                        "different-admin"
                )
        );
    }

    @Test
    void signedInAdministratorCannotChangeOwnRole() {
        AppUser admin = user(
                1L,
                "admin",
                "System Administrator",
                "hash",
                Role.ADMIN,
                true
        );
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));

        assertThrows(
                UserOperationNotAllowedException.class,
                () -> userService.updateUser(
                        1L,
                        new UpdateUserRequestDTO(
                                "System Administrator",
                                Role.TECHNICIAN,
                                true,
                                null
                        ),
                        "admin"
                )
        );

        verify(userRepository, never()).save(any(AppUser.class));
    }

    @Test
    void disabledUserIsDisabledForSpringSecurity() {
        AppUser technician = user(
                8L,
                "disabled.tech",
                "Disabled Technician",
                "hash",
                Role.TECHNICIAN,
                false
        );
        when(userRepository.findByUsernameIgnoreCase("disabled.tech"))
                .thenReturn(Optional.of(technician));

        UserDetails details = userService.loadUserByUsername("disabled.tech");

        assertFalse(details.isEnabled());
    }

    private static AppUser user(
            Long id,
            String username,
            String displayName,
            String passwordHash,
            Role role,
            boolean enabled
    ) {
        AppUser user = new AppUser();
        user.setId(id);
        user.setUsername(username);
        user.setDisplayName(displayName);
        user.setPasswordHash(passwordHash);
        user.setRole(role);
        user.setEnabled(enabled);
        return user;
    }
}
