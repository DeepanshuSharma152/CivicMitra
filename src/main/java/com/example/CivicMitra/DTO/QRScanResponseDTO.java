package com.example.CivicMitra.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QRScanResponseDTO {
    private String scanResult;    // VALID / EXPIRED / ALREADY_USED / GPS_MISMATCH
    private String houseNumber;
    private boolean collected;
    private String message;      // human readable result for worker screen
    public QRScanResponseDTO(String scanResult,
                             String houseNumber,
                             boolean collected,String message) {
        this.scanResult = scanResult;
        this.houseNumber = houseNumber;
        this.collected = collected;
        this.message=message;
    }
}

//why we use constructors instead of lombok annotations
/*1. Why a Custom Constructor in a DTO?
While @AllArgsConstructor is faster to write, a Custom Constructor in a DTO (Data Transfer Object) provides two major benefits:

Logic at the Entry Point: If you ever need to ensure that scanResult is always converted to UpperCase or that houseNumber is never null, you can put that logic inside the custom constructor. Annotations just blindly map values.

Decoupling from Lombok: In very high-security or mission-critical projects, developers avoid Lombok on DTOs to ensure the class remains "Plain Old Java" (POJO). This ensures that if you ever move to a different framework, your data structures don't break.

Explicit Intent: For someone reading your code (like your teacher or a research reviewer), seeing the constructor makes it 100% clear how the object is initialized without needing to look at Lombok's hidden generated code.



2. Constructor Injection vs. @Autowired
In modern Spring (Spring Boot 3+), this is the Gold Standard. Here is why it beats @Autowired:

A. Finality & Immutability
By using a constructor, you can mark your dependencies as final. This means once the Service starts, the Repository cannot be changed or set to null. @Autowired on a field does not allow the final keyword.

B. Testability (The Researcher's Choice)
If you are writing a research paper, you might want to write "Unit Tests."

With @Autowired, you must start the entire Spring Context to test your service.

With Constructor Injection, you can just pass a "Mock" repository into the constructor manually in a simple Java test. It’s faster and cleaner.

C. The "Null" Guardrail
With field @Autowired, your code might compile, but if Spring fails to find a bean, you get a NullPointerException at runtime when you call a method. With a constructor, the app will fail to start immediately if a dependency is missing. This is called "Fail-Fast" behavior.

3. Impact on your Modular Model Structure
Now that you are creating sub-packages (model.complaints, model.segregation), using Constructor Injection in your Services becomes even more important. It makes the "dependencies" between these packages very visible.

For example, in your SegregationService, the constructor will clearly show:

"I need the HouseholdRepository and the WasteAiService to function."
 */