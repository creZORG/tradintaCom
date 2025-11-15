
export type NewsletterContentOutput = {
  subjectLine: string;
  introduction: string;
  productFeatures: {
    productName: string;
    generatedCopy: string;
    callToAction: string;
  }[];
  closing: string;
};
