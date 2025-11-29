'use server';

/**
 * @fileOverview Generates assignment suggestions based on course topics.
 *
 * - generateAssignmentSuggestions - A function that generates assignment suggestions.
 * - GenerateAssignmentSuggestionsInput - The input type for the generateAssignmentSuggestions function.
 * - GenerateAssignmentSuggestionsOutput - The return type for the generateAssignmentSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAssignmentSuggestionsInputSchema = z.object({
  courseTopic: z.string().describe('The topic of the course for which to generate assignment suggestions.'),
  uploadedFileContent: z.string().optional().describe('Content of uploaded file to automatically generate assignment instructions from.'),
});

export type GenerateAssignmentSuggestionsInput = z.infer<typeof GenerateAssignmentSuggestionsInputSchema>;

const GenerateAssignmentSuggestionsOutputSchema = z.object({
  assignmentSuggestions: z.array(z.string()).describe('A list of assignment suggestions based on the course topic.'),
});

export type GenerateAssignmentSuggestionsOutput = z.infer<typeof GenerateAssignmentSuggestionsOutputSchema>;

export async function generateAssignmentSuggestions(
  input: GenerateAssignmentSuggestionsInput
): Promise<GenerateAssignmentSuggestionsOutput> {
  return generateAssignmentSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAssignmentSuggestionsPrompt',
  input: {
    schema: GenerateAssignmentSuggestionsInputSchema,
  },
  output: {
    schema: GenerateAssignmentSuggestionsOutputSchema,
  },
  prompt: `You are an expert teacher, skilled at generating engaging and relevant assignment suggestions based on course topics.

  Course Topic: {{{courseTopic}}}
  {{#if uploadedFileContent}}
  Uploaded file content: {{{uploadedFileContent}}}
  Use this to generate assignment instructions.
  {{/if}}

  Generate a list of assignment suggestions that would be suitable for this course topic. Return the suggestions as a numbered list.
  `,
});

const generateAssignmentSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateAssignmentSuggestionsFlow',
    inputSchema: GenerateAssignmentSuggestionsInputSchema,
    outputSchema: GenerateAssignmentSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

