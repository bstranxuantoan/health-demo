
import { REQUIRED_SECTIONS } from './constants';

export interface Section {
  title: string;
  content: string;
}

export type RequiredSection = typeof REQUIRED_SECTIONS[number];
