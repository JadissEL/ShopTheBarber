import { sovereign } from './apiClient';

// Integration exports using sovereign API client
export const Core = sovereign.integrations.Core;

export const InvokeLLM = sovereign.integrations.Core.InvokeLLM;

export const SendEmail = sovereign.integrations.Core.SendEmail;

export const SendSMS = sovereign.integrations.Core.SendSMS;

export const UploadFile = sovereign.integrations.Core.UploadFile;

export const GenerateImage = sovereign.integrations.Core.GenerateImage;

export const ExtractDataFromUploadedFile = sovereign.integrations.Core.ExtractDataFromUploadedFile;
