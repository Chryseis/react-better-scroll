import React from 'react'

interface PullDownRefresh {
    threshold: number,
    stop: number
}

interface PullUpLoad {
    threshold: number,
    txt: { more: any, nomore: any }
}

export interface ScrollBarProps {
    tagName?: string,
    prefixCls?: string,
    scrollPrefixCls?: string,
    refresh?: () => Promise<any>,
    loadMore?: () => Promise<any>
    pullDownRefresh: PullDownRefresh,
    pullUpLoad: PullUpLoad,
    style: React.CSSProperties
}

export default class ScrollBar extends React.Component<ScrollBarProps, any> {
    static isRebounding: boolean;
    static defaultProps: {
        tagName: string,
        prefixCls: string,
        scrollPrefixCls: string,
        refresh: () => Promise<any>,
        loadMore: () => Promise<any>
    };

    render(): React.ReactElement;
}