import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { TypicalAstType, Person } from './generated/ast.js';
import type { TypicalServices } from './typical-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: TypicalServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.TypicalValidator;
    const checks: ValidationChecks<TypicalAstType> = {
        Person: validator.checkPersonStartsWithCapital
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class TypicalValidator {

    checkPersonStartsWithCapital(person: Person, accept: ValidationAcceptor): void {
        if (person.name) {
            const firstChar = person.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('warning', 'Person name should start with a capital.', { node: person, property: 'name' });
            }
        }
    }

}
