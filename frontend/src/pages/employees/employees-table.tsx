import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Person } from "@/components/shared/data-display/person";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EmployeeRecord } from "@/data/employees-api";
const joiningDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
export function EmployeesTable({ employees }: { employees: EmployeeRecord[] }) {
  return (
    <Table aria-label="Employee records">
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Joining Date</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((employee) => (
          <TableRow key={employee.id}>
            <TableCell>
              <Link
                className="employee-person-link"
                to={"/employees/" + employee.id}
              >
                <Person name={employee.fullName} detail={employee.email} />
              </Link>
            </TableCell>
            <TableCell>{employee.position}</TableCell>
            <TableCell>{employee.department || "Not provided"}</TableCell>
            <TableCell>{employee.location || "Not provided"}</TableCell>
            <TableCell>
              <time dateTime={employee.joiningDate}>
                {joiningDate.format(
                  new Date(employee.joiningDate + "T00:00:00Z"),
                )}
              </time>
            </TableCell>
            <TableCell className="text-right">
              <Button asChild variant="ghost" size="sm">
                <Link
                  to={"/employees/" + employee.id}
                  aria-label={"Open employee record for " + employee.fullName}
                >
                  Open <ArrowUpRight aria-hidden="true" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
