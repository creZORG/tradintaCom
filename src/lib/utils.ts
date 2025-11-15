import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '');
}

// Simple markdown to HTML converter
export const createMarkup = (markdown?: string) => {
    if (!markdown) return { __html: '' };

    let html = markdown
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/!\[(.*?)\]\((.*?)\)/gim, "<img alt='$1' src='$2' class='rounded-md' />")
        .replace(/\[(.*?)\]\((.*?)\)/gim, "<a href='$2' target='_blank' rel='noopener noreferrer' class='text-primary underline'>$1</a>")
        .replace(/\n$/gim, '<br />')
        .replace(/\n/g, '<br />');

    // Handle unordered lists
    html = html.replace(/(?:<br \/>\s*)?\*\s(.*?)(?=<br \/>|$)/g, '<li>$2</li>');
    html = html.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>');
    
    // Handle ordered lists
    html = html.replace(/(?:<br \/>\s*)?\d+\.\s(.*?)(?=<br \/>|$)/g, '<li>$2</li>');
    html = html.replace(/(<li>.*<\/li>)+/g, (match) => {
        if(match.includes('<ul>')) return match;
        // A simple heuristic to check if it's likely an ordered list
        if (match.match(/<li>\d/)) { // A bit fragile, assumes numbers are at the start
             return `<ol>${match.replace(/<li>(\d+\.)/g, '<li>')}</ol>`;
        }
        return match;
    });

    html = html.replace(/<br \/>(\n)?/g, '<br />').replace(/(<br \/>){2,}/g, '<br />');
    html = html.replace(/<p><\/p>/g, '');
    
    return { __html: html };
};
