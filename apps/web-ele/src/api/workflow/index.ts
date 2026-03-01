import { workflowDefinitionApi } from './definition';
import { workflowInstanceApi } from './instance';
import { workflowTaskApi } from './task';
import { workflowFormApi } from './form';

export const workflowApi = {
  definition: workflowDefinitionApi,
  instance: workflowInstanceApi,
  task: workflowTaskApi,
  form: workflowFormApi
};
