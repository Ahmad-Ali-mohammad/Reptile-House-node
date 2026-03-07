import React from 'react';

interface PolicyPageProps {
    title: string;
    children?: React.ReactNode;
    contentHtml?: string;
}

const PolicyPage: React.FC<PolicyPageProps> = ({ title, children, contentHtml }) => {
    return (
        <div className="mx-auto max-w-4xl">
            <h1 className="mb-6 text-center text-3xl font-bold sm:mb-8 sm:text-4xl">{title}</h1>
            <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/5 p-4 text-gray-300 backdrop-blur-lg sm:p-8">
                <div className="prose prose-invert max-w-none overflow-x-auto break-words leading-loose prose-headings:text-amber-400 prose-img:max-w-full prose-img:rounded-xl prose-p:text-gray-300">
                    {contentHtml ? (
                        <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
                    ) : (
                        children || <p className="text-gray-500">لا يوجد محتوى منشور بعد.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PolicyPage;
