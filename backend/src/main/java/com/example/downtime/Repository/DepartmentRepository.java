package com.example.downtime.Repository;

import com.example.downtime.Entities.Department;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepository
        extends JpaRepository<Department, Long> {
}