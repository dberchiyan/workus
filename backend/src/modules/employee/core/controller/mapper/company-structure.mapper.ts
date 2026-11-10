import type { Department, StructurePosition } from '../../service/company-structure.service';
import type {
  CompanyStructureResponse,
  DepartmentResponse,
  StructurePositionResponse,
} from '../dto/company-structure.response';

export const toStructurePositionResponse = (
  position: StructurePosition,
): StructurePositionResponse => ({
  id: position.id,
  title: position.title,
  employeeCount: position.employeeCount,
  removable: position.removable,
  version: position.version,
});

export const toDepartmentResponse = (department: Department): DepartmentResponse => ({
  id: department.id,
  name: department.name,
  positions: department.positions.map(toStructurePositionResponse),
  version: department.version,
});

export const toCompanyStructureResponse = (
  departments: Department[],
): CompanyStructureResponse => ({
  departments: departments.map(toDepartmentResponse),
});
