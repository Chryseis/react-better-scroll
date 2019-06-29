import './index.less'
import React from 'react'
import BScroll from 'better-scroll'

const initTop = -50
const defaultPullDownRefresh = {
    threshold: 50,
    stop: 80
}
const defaultPullUpLoad = {
    threshold: 0,
    txt: {
        more: '加载中',
        nomore: '没有更多了',
    },
}

class ScrollBar extends React.Component {
    static defaultProps = {
        tagName: 'ul',
        prefixCls: '',
        scrollPrefixCls: '',
        refresh: () => {
        },
        loadMore: () => {
        }
    }

    isRebounding = false

    state = {
        isPullingDown: false,
        isPullUpLoad: false,
        pullDownTop: initTop,
        beforePullDown: true,
        scrollHeight: 0
    }

    componentDidMount() {
        this.initScroll()
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.children !== prevProps.children) {
            if (this.wrapRef.clientHeight > 0) {
                if (this.wrapRef.clientHeight >= this.scrollRef.clientHeight) {
                    //解决内容高度不足一屏时，也可以下拉加载
                    this.setState({
                        scrollHeight: this.wrapRef.clientHeight + 1
                    }, () => this.scroll.refresh())
                } else {
                    if (prevState.scrollHeight !== 0 && prevState.scrollHeight !== 'auto' && (this.scrollRef.clientHeight - this.wrapRef.clientHeight > 1)) {
                        this.setState({
                            scrollHeight: 'auto'
                        }, () => this.scroll.refresh())
                    }
                }
            }
        }
    }

    componentWillUnmount() {
        this.scroll.stop()
        this.scroll.finishPullDown()
        this.scroll.finishPullUp()
        this.scroll.destroy()
        this.scroll = null
        clearTimeout(this.timerRebound)
        clearTimeout(this.timerAfter)
    }

    initScroll = () => {
        const { pullDownRefresh, pullUpLoad, options } = this.props

        let _pullDownRefresh = typeof pullDownRefresh === 'object' ? {
            ...defaultPullDownRefresh,
            ...pullDownRefresh
        } : (pullDownRefresh ? defaultPullDownRefresh : false)

        let _pullUpLoad = typeof pullUpLoad === 'object' ? {
            ...defaultPullUpLoad,
            ...pullUpLoad
        } : (pullUpLoad ? defaultPullUpLoad : false)

        let _options = options || {}

        //解决内容高度不足一屏时，也可以下拉加载
        if (this.wrapRef.clientHeight >= this.scrollRef.clientHeight && this.wrapRef.clientHeight > 0) {
            this.setState({
                scrollHeight: this.wrapRef.clientHeight + 1
            })
        }

        this.scroll = new BScroll(this.wrapRef, {
            click: true,
            pullDownRefresh: _pullDownRefresh,
            pullUpLoad: _pullUpLoad,
            ..._options
        })
        this.scroll.on('beforeScrollStart', () => {
            //解决图片高度自适应时，高度未知的情况
            this.scroll.refresh()
        })

        this.initPullLoadRefresh()
        this.initPullUpLoad()
    }

    initPullUpLoad = () => {
        this.scroll.on('pullingUp', () => {
            const { loadMore, hasNext } = this.props
            if (hasNext) {
                this.setState({
                    isPullUpLoad: true
                })

                loadMore().then(() => {
                    this.setState({
                        isPullUpLoad: false,
                    })
                    this.scroll.finishPullUp()
                    this.scroll.refresh()
                })
            }
        })

    }

    initPullLoadRefresh = () => {
        const { refresh, pullDownRefresh } = this.props
        const { beforePullDown, pullDownTop } = this.state

        let _pullDownRefresh = typeof pullDownRefresh === 'object' ? {
            ...defaultPullDownRefresh,
            ...pullDownRefresh
        } : (pullDownRefresh ? defaultPullDownRefresh : false)

        this.scroll.on('pullingDown', () => {
            this.scroll.openPullUp()
            this.setState({
                beforePullDown: false,
                isPullingDown: true
            })
            this.scroll.disable()


            refresh().then(_ => {
                this.scroll.enable()
                this.setState({
                    isPullingDown: false
                })
                this.reboundPullDown().then(_ => {
                    this.afterPullDown()
                })
            })
        })

        this.scroll.on('scroll', ({ y }) => {
            if (y < 0) {
                return
            }
            if (beforePullDown) {
                this.setState({
                    pullDownTop: Math.min(y + pullDownTop, 10)
                })
            }

            if (this.isRebounding) {
                this.setState({
                    pullDownTop: 10 - (_pullDownRefresh.stop - y)
                })
            }
        })
    }

    reboundPullDown = () => {
        const { pullDownRefresh: { stopTime = 600 } } = this.props
        return new Promise(resolve => {
            this.timerRebound = setTimeout(_ => {
                this.isRebounding = true
                this.scroll.finishPullDown()
                resolve()
            }, stopTime)
        })
    }

    afterPullDown = () => {
        this.timerAfter = setTimeout(() => {
            this.setState({
                pullDownTop: initTop,
                beforePullDown: true
            })
            this.isRebounding = false
            this.scroll.refresh()
        }, this.scroll.options.bounceTime)
    }

    renderPullDown = () => {
        const { pullDownRefresh } = this.props
        const { isPullingDown, beforePullDown, pullDownTop } = this.state

        if (!isNaN(pullDownTop)) {
            if (pullDownRefresh) {
                if (beforePullDown) {
                    return <div className="pull_down_refresh" style={{ top: pullDownTop }}>
                        <img src="http://melly-weex-cdn.yingyinglicai.com/loading_f7.gif" alt="refresh"
                             className="refresh_image"/>
                    </div>
                } else {
                    if (isPullingDown) {
                        return <div className="pull_down_refresh" style={{ top: pullDownTop }}>
                            <img src="http://melly-weex-cdn.yingyinglicai.com/loading_f7.gif" alt="refresh"
                                 className="refresh_image"/>
                        </div>
                    } else {
                        return <div className="pull_down_refresh" style={{ top: pullDownTop }}>
                            <img src="http://melly-weex-cdn.yingyinglicai.com/loading_f7.gif" alt="refresh"
                                 className="refresh_image"/>
                        </div>
                    }
                }
            } else {
                return null
            }
        } else {
            this.scroll.stop()
        }
    }

    renderPullUp = () => {
        const { hasNext, pullUpLoad } = this.props
        const { isPullUpLoad } = this.state
        let _pullUpLoad = typeof pullUpLoad === 'object' ? {
            ...defaultPullUpLoad,
            ...pullUpLoad
        } : (pullUpLoad ? defaultPullUpLoad : false)

        if (pullUpLoad) {
            if (hasNext && isPullUpLoad) {
                return _pullUpLoad.txt.more ? <div className="pull_up_load">
                    {_pullUpLoad.txt.more}
                </div> : null
            } else {
                return _pullUpLoad.txt.nomore ? <div className="pull_up_load">
                    {_pullUpLoad.txt.nomore}
                </div> : null
            }
        } else {
            return null
        }
    }

    render() {
        const { tagName, prefixCls, scrollPrefixCls, style } = this.props
        const { scrollHeight } = this.state
        return <div className="scroll_bar_bs" ref={ref => this.wrapRef = ref} style={style}>
            <div className={`${prefixCls ? prefixCls : ''}`}>
                {
                    React.createElement(tagName, {
                        className: scrollPrefixCls ? scrollPrefixCls : '',
                        ref: ref => this.scrollRef = ref,
                        style: { minHeight: scrollHeight > 0 ? scrollHeight : 'auto' }
                    }, this.props.children)
                }
                {this.renderPullUp()}
            </div>
            {
                this.renderPullDown()
            }
        </div>
    }
}

export default ScrollBar