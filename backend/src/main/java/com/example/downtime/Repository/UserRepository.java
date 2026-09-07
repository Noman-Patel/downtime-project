package com.example.downtime.Repository;

import com.example.downtime.Entities.AppUser;
import com.example.downtime.Entities.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByUsernameIgnoreCase(String username);

    boolean existsByUsernameIgnoreCase(String username);

    long countByRoleAndEnabledTrue(Role role);
}
