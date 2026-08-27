package com.example.downtime.Service;

import com.example.downtime.Entities.Department;
import com.example.downtime.Exception.DepartmentNotFoundException;
import com.example.downtime.Repository.DepartmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentService(
            DepartmentRepository departmentRepository
    ) {
        this.departmentRepository = departmentRepository;
    }

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    public Department getDepartmentById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() ->
                        new DepartmentNotFoundException(id)
                );
    }

    public Department createDepartment(Department department) {

        department.setId(null);

        return departmentRepository.save(department);
    }

    public Department updateDepartment(
            Long id,
            Department updatedDepartment
    ) {

        Department existingDepartment =
                getDepartmentById(id);

        existingDepartment.setName(
                updatedDepartment.getName()
        );

        existingDepartment.setDescription(
                updatedDepartment.getDescription()
        );

        existingDepartment.setLocation(
                updatedDepartment.getLocation()
        );

        return departmentRepository.save(
                existingDepartment
        );
    }

    public void deleteDepartment(Long id) {

        Department department =
                getDepartmentById(id);

        departmentRepository.delete(department);
    }
}