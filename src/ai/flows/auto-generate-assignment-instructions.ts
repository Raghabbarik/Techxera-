'use server';

/**
 * @fileOverview This file defines a Genkit flow that automatically generates assignment instructions based on uploaded files.
 *
 * @remarks
 * The flow takes assignment files as input and uses an LLM to generate instructions for the assignment.
 *
 * @exports generateAssignmentInstructions - The main function to trigger the flow.
 * @exports GenerateAssignmentInstructionsInput - The input type for the generateAssignmentInstructions function.
 * @exports GenerateAssignmentInstructionsOutput - The output type for the generateAssignmentInstructions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateAssignmentInstructionsInputSchema = z.object({
  files: z
    .array(
      z.object({
        filename: z.string().describe('The name of the uploaded file.'),
        dataUri: z
          .string()
          .describe(
            'The file content as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' /* prettier-ignore */
          ),
      })
    )
    .describe('The uploaded assignment files.'),
  courseTopic: z.string().describe('The topic of the course.'),
});
export type GenerateAssignmentInstructionsInput = z.infer<
  typeof GenerateAssignmentInstructionsInputSchema
>;

const GenerateAssignmentInstructionsOutputSchema = z.object({
  instructions: z
    .string()
    .describe('The generated instructions for the assignment.'),
});
export type GenerateAssignmentInstructionsOutput = z.infer<
  typeof GenerateAssignmentInstructionsOutputSchema
>;

export async function generateAssignmentInstructions(
  input: GenerateAssignmentInstructionsInput
): Promise<GenerateAssignmentInstructionsOutput> {
  return generateAssignmentInstructionsFlow(input);
}

const generateAssignmentInstructionsPrompt = ai.definePrompt({
  name: 'generateAssignmentInstructionsPrompt',
  input: { schema: GenerateAssignmentInstructionsInputSchema },
  output: { schema: GenerateAssignmentInstructionsOutputSchema },
  prompt: `You are an experienced teacher creating instructions for an assignment based on the files provided. The course topic is {{{courseTopic}}}.

  Here are the files for the assignment:
  {{#each files}}
  Filename: {{{filename}}}
  Content:
  {{media url=dataUri}}
  {{/each}}

  Generate clear and concise instructions for the assignment, ensuring students understand the objectives, requirements, and how to complete the assignment successfully. The instructions should be detailed enough for a student to complete the assignment without further assistance.
  Return the generated instructions.
  `,
});

const generateAssignmentInstructionsFlow = ai.defineFlow(
  {
    name: 'generateAssignmentInstructionsFlow',
    inputSchema: GenerateAssignmentInstructionsInputSchema,
    outputSchema: GenerateAssignmentInstructionsOutputSchema,
  },
  async input => {
    const { output } = await generateAssignmentInstructionsPrompt(input);
    return output!;
  }
);
