package com.example.downtime.Controller;

import com.example.downtime.Entities.ProductionLine;
import com.example.downtime.Service.ProductionLineService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/production-lines")
public class ProductionLineController {

    private final ProductionLineService productionLineService;

    public ProductionLineController(ProductionLineService productionLineService) {
        this.productionLineService = productionLineService;
    }

    @GetMapping
    public List<ProductionLine> getAllProductionLines() {
        return productionLineService.getAllProductionLines();
    }


    @PostMapping
    public ProductionLine createProductionLine(
            @RequestBody ProductionLine productionLine
    ) {
        return productionLineService.createProductionLine(productionLine);
    }
}