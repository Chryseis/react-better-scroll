import './index.less'
import React from 'react'
import BScroll from 'better-scroll'

const initTop = -50
const defaultPullDownRefresh = {
    threshold: 50,
    stop: 80,
    beforeRefresh: <img src="http://melly-weex-cdn.yingyinglicai.com/loading_f7.gif" alt="refresh"
                        className="refresh_image"/>,
    progressRefresh: <img src="http://melly-weex-cdn.yingyinglicai.com/loading_f7.gif" alt="refresh"
                          className="refresh_image"/>,
    afterRefresh: <img src="http://melly-weex-cdn.yingyinglicai.com/loading_f7.gif" alt="refresh"
                       className="refresh_image"/>
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

    componentDidUpdate(prevProps) {
        if (this.props.children !== prevProps.children) {

            //解决下拉刷新属性动态改变
            if (this.props.pullDownRefresh) {
                this.scroll.openPullDown()
            } else {
                this.scroll.closePullDown()
            }

            //解决上拉加载属性动态改变
            if (this.props.pullUpLoad) {
                this.scroll.openPullUp()
            } else {
                this.scroll.closePullUp()
            }

            //解决内容高度不足一屏时，也可以下拉加载
            if (this.wrapRef.clientHeight >= this.scrollRef.clientHeight && this.wrapRef.clientHeight > 0) {
                this.setState({
                    scrollHeight: this.wrapRef.clientHeight + 1
                }, () => this.scroll.refresh())
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
        console.log(pullDownRefresh, pullUpLoad, 'init')

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
            console.log('pullingUp')
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
            } else {
                this.scroll.refresh()
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

        let _pullDownRefresh = typeof pullDownRefresh === 'object' ? {
            ...defaultPullDownRefresh,
            ...pullDownRefresh
        } : (pullDownRefresh ? defaultPullDownRefresh : false)

        if (!isNaN(pullDownTop)) {
            if (pullDownRefresh) {
                if (beforePullDown) {
                    return <div className="pull_down_refresh" style={{ top: pullDownTop }}>
                        {_pullDownRefresh.beforeRefresh}
                    </div>
                } else {
                    if (isPullingDown) {
                        return <div className="pull_down_refresh" style={{ top: pullDownTop }}>
                            {_pullDownRefresh.progressRefresh}
                        </div>
                    } else {
                        return <div className="pull_down_refresh" style={{ top: pullDownTop }}>
                            {_pullDownRefresh.afterRefresh}
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
                return <div className="pull_up_load">
                    {_pullUpLoad.txt.more}
                </div>
            } else {
                return <div className="pull_up_load">
                    {_pullUpLoad.txt.nomore}
                </div>
            }
        } else {
            return null
        }
    }

    render() {
        const { tagName, prefixCls, scrollPrefixCls, style } = this.props
        const { scrollHeight } = this.state
        return <div className="scroll_bar_bs" ref={ref => this.wrapRef = ref} style={style}>
            <div className={`${prefixCls ? prefixCls : ''}`} ref={ref => this.scrollRef = ref}
                 style={{ height: scrollHeight > 0 ? scrollHeight : 'auto' }}>
                {
                    React.createElement(tagName, { className: scrollPrefixCls ? scrollPrefixCls : '' }, this.props.children)
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