package com.example.downtime.Controller;

import com.example.downtime.Entities.Department;
import com.example.downtime.Service.DepartmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(
            DepartmentService departmentService
    ) {
        this.departmentService = departmentService;
    }

    @GetMapping
    public List<Department> getAllDepartments() {
        return departmentService.getAllDepartments();
    }

    @GetMapping("/{id}")
    public Department getDepartmentById(
            @PathVariable Long id
    ) {
        return departmentService.getDepartmentById(id);
    }

    @PostMapping
    public ResponseEntity<Department> createDepartment(
            @RequestBody Department department
    ) {

        Department createdDepartment =
                departmentService.createDepartment(
                        department
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdDepartment);
    }

    @PutMapping("/{id}")
    public Department updateDepartment(
            @PathVariable Long id,
            @RequestBody Department department
    ) {

        return departmentService.updateDepartment(
                id,
                department
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDepartment(
            @PathVariable Long id
    ) {

        departmentService.deleteDepartment(id);

        return ResponseEntity.noContent().build();
    }
}