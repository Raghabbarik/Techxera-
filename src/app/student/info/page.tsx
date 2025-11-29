import { PageHeader } from '@/components/page-header';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CollegeInfoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="College Information"
        description="Find details about courses, departments, and important notices."
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Departments & Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Department of Computer Science</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>B.Sc. in Computer Science</li>
                    <li>M.Sc. in Data Science</li>
                    <li>Ph.D. in Artificial Intelligence</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Department of Physics</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>B.Sc. in Physics</li>
                    <li>M.Sc. in Astrophysics</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Department of History</AccordionTrigger>
                <AccordionContent>
                   <ul className="list-disc pl-5 space-y-1">
                    <li>B.A. in World History</li>
                    <li>M.A. in Ancient Civilizations</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Notices & Updates</CardTitle>
          </CardHeader>
          <CardContent>
             <ul className="space-y-4">
                <li className="border-l-4 border-primary pl-4">
                    <p className="font-medium">Holiday Schedule</p>
                    <p className="text-sm text-muted-foreground">The college will be closed for winter break from Dec 24th to Jan 2nd.</p>
                </li>
                <li className="border-l-4 border-yellow-500 pl-4">
                    <p className="font-medium">Campus Maintenance</p>
                    <p className="text-sm text-muted-foreground">The north wing will have limited access next week due to scheduled maintenance.</p>
                </li>
             </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
