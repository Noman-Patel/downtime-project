package com.example.downtime.Config;

import com.example.downtime.Entities.AppUser;
import com.example.downtime.Entities.Role;
import com.example.downtime.Repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("!prod")
@ConditionalOnProperty(
        name = "app.security.bootstrap.enabled",
        havingValue = "true",
        matchIfMissing = true
)
public class LocalUserInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalUserInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminPassword;
    private final String technicianPassword;

    public LocalUserInitializer(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.security.bootstrap.admin-password:Admin123!}") String adminPassword,
            @Value("${app.security.bootstrap.technician-password:Tech123!}") String technicianPassword
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminPassword = adminPassword;
        this.technicianPassword = technicianPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) {
            log.info("Local user accounts were not added because user data already exists");
            return;
        }

        userRepository.save(user(
                "admin",
                "System Administrator",
                adminPassword,
                Role.ADMIN
        ));
        userRepository.save(user(
                "technician",
                "Demo Technician",
                technicianPassword,
                Role.TECHNICIAN
        ));

        log.warn(
                "Created local starter accounts for admin and technician. "
                        + "Set custom bootstrap passwords before sharing this environment."
        );
    }

    private AppUser user(
            String username,
            String displayName,
            String password,
            Role role
    ) {
        AppUser user = new AppUser();
        user.setUsername(username);
        user.setDisplayName(displayName);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role);
        user.setEnabled(true);
        return user;
    }
}
