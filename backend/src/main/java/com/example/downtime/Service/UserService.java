package com.example.downtime.Service;

import com.example.downtime.DTO.CreateUserRequestDTO;
import com.example.downtime.DTO.UpdateUserRequestDTO;
import com.example.downtime.DTO.UserDTO;
import com.example.downtime.Entities.AppUser;
import com.example.downtime.Entities.Role;
import com.example.downtime.Exception.UserNotFoundException;
import com.example.downtime.Exception.UserOperationNotAllowedException;
import com.example.downtime.Exception.UsernameAlreadyExistsException;
import com.example.downtime.Repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) {
        AppUser user = userRepository.findByUsernameIgnoreCase(normalizeUsername(username))
                .orElseThrow(() -> new UsernameNotFoundException("Invalid username or password"));

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPasswordHash())
                .roles(user.getRole().name())
                .disabled(!user.isEnabled())
                .build();
    }

    @Transactional(readOnly = true)
    public UserDTO getCurrentUser(String username) {
        return toDTO(findByUsername(username));
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll(Sort.by(Sort.Direction.ASC, "username"))
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public UserDTO createUser(CreateUserRequestDTO request) {
        String username = normalizeUsername(request.username());
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new UsernameAlreadyExistsException(username);
        }

        AppUser user = new AppUser();
        user.setUsername(username);
        user.setDisplayName(request.displayName().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        user.setEnabled(true);

        return toDTO(userRepository.save(user));
    }

    @Transactional
    public UserDTO updateUser(
            Long id,
            UpdateUserRequestDTO request,
            String currentUsername
    ) {
        AppUser user = findById(id);
        boolean disablingCurrentUser = user.getUsername().equalsIgnoreCase(currentUsername)
                && !request.enabled();

        if (disablingCurrentUser) {
            throw new UserOperationNotAllowedException(
                    "You cannot disable your own account while signed in"
            );
        }

        boolean changingCurrentUserRole = user.getUsername().equalsIgnoreCase(currentUsername)
                && user.getRole() != request.role();
        if (changingCurrentUserRole) {
            throw new UserOperationNotAllowedException(
                    "You cannot change your own role while signed in"
            );
        }

        ensureAnEnabledAdministratorRemains(user, request.role(), request.enabled());
        validateOptionalPassword(request.password());

        user.setDisplayName(request.displayName().trim());
        user.setRole(request.role());
        user.setEnabled(request.enabled());
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }

        return toDTO(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id, String currentUsername) {
        AppUser user = findById(id);
        if (user.getUsername().equalsIgnoreCase(currentUsername)) {
            throw new UserOperationNotAllowedException(
                    "You cannot delete your own account while signed in"
            );
        }

        if (user.getRole() == Role.ADMIN
                && user.isEnabled()
                && userRepository.countByRoleAndEnabledTrue(Role.ADMIN) <= 1) {
            throw new UserOperationNotAllowedException(
                    "At least one enabled administrator account is required"
            );
        }

        userRepository.delete(user);
    }

    private AppUser findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
    }

    private AppUser findByUsername(String username) {
        return userRepository.findByUsernameIgnoreCase(normalizeUsername(username))
                .orElseThrow(() -> new UserNotFoundException(username));
    }

    private void ensureAnEnabledAdministratorRemains(
            AppUser existingUser,
            Role requestedRole,
            boolean requestedEnabled
    ) {
        boolean removesEnabledAdministrator = existingUser.getRole() == Role.ADMIN
                && existingUser.isEnabled()
                && (requestedRole != Role.ADMIN || !requestedEnabled);

        if (removesEnabledAdministrator
                && userRepository.countByRoleAndEnabledTrue(Role.ADMIN) <= 1) {
            throw new UserOperationNotAllowedException(
                    "At least one enabled administrator account is required"
            );
        }
    }

    private void validateOptionalPassword(String password) {
        if (password == null || password.isBlank()) {
            return;
        }
        if (password.length() < 8 || password.length() > 72) {
            throw new UserOperationNotAllowedException(
                    "Password must be between 8 and 72 characters"
            );
        }
    }

    private String normalizeUsername(String username) {
        return username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
    }

    private UserDTO toDTO(AppUser user) {
        return new UserDTO(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getRole(),
                user.isEnabled(),
                user.getCreatedAt()
        );
    }
}
