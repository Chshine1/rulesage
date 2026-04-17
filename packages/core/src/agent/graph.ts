import { StateGraph } from '@langchain/langgraph';
import { z } from 'zod';

const workflow = new StateGraph(z.object({}));

workflow.compile();
