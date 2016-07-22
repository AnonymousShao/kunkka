require('./style/index.less');

var React = require('react');
var moment = require('client/libs/moment');
var getTime = require('client/utils/time_unification');
var Attach = require('../../modules/ticket/pop/create_ticket/attach');
var Adapter = require('client/components/modal_common/subs/adapter');
var __ = require('locale/client/ticket.lang.json');
var resources = '/static/assets/ticket/ticket_icon_2x.png';

class Detail extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      replies: [],
      files: []
    };

    moment.locale(HALO.configs.lang);

    ['submitReply', 'onCancel'].forEach((m) => {
      this[m] = this[m].bind(this);
    });
  }

  componentWillMount() {
    this.setState({
      loading: this.props.url ? true : false,
      replies: this.props.rawItem.replies,
      files: this.props.rawItem.attachments
    });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      replies: nextProps.rawItem.replies,
      files: nextProps.rawItem.attachments
    });
  }

  onAction(actionType, data) {
    this.props.onAction && this.props.onAction(this.props.tabKey, actionType, data);
  }

  submitReply() {
    this.props.submitReply && this.props.submitReply(this);
  }

  onCancel() {
    this.props.onCancel && this.props.onCancel();
  }

  render() {
    var item = this.props.rawItem,
      state = this.state,
      replies = state.replies,
      files = state.files,
      id = HALO.user.userId;
    return (
      <div className="halo-com-detail">
        <div className="detail-question">
          <div className="content-question">
            <div className="question-left">
              <div className="question-title">{item.title}</div>
              <div className="question-content">{item.description}</div>
            </div>
            <div className="question-right">
              {replies.length === 0 ?
              '@' + __.no_reply
              : '#' + replies[replies.length - 1].owner.substring(0, 4)
                + ' @' + getTime(replies[replies.length - 1].updatedAt) + ' - ' + __.replied}</div>
          </div>
          <div className="question-attach">
            {files && files.map((file, index) => {
              var style = {
                background: 'url(' + file.url + ') no-repeat',
                backgroundSize: 'cover',
                width: '110px',
                height: '80px'
              };
              return (
                <div key={index} className="file_url" onClick={this.downloadFile}>
                  <a href={file.url} target="_blank">
                    <div style={style}></div>
                    <div>{file.url.substring(file.url.lastIndexOf('/') + 1)}</div>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
        <div className="detail-reply">
          <div>
            {replies.map((reply, index) => {
              var classNameReply = 'reply',
                classNameMsg = 'msg';

              if(reply.owner === id) {
                classNameReply += ' reply-right';
                classNameMsg += ' msg-right';
              }
              if (reply.role && reply.role !== 'member') {
                classNameReply += ' admin';
              }
              return (
                <div key={index} className="reply-msg">
                  <div className={classNameReply}>
                    <img src={resources} />
                    <div className="reply-name">{reply.username}</div>
                  </div>
                  <div className={classNameMsg}>
                    <div className="reply-content">{reply.content}</div>
                    <div className="reply-update">{getTime(reply.updatedAt, null, 'HH:mm')}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {item.status === 'proceeding' ?
            <div className="reply-text">
              {__.reply}
              <textarea ref="reply"/>
              <div className="reply-attach">
                <Adapter ref="upload" renderer={Attach}/>
              </div>
              <div className="detail-bottom">
                <button className="btn btn-submit" onClick={this.submitReply}>{__.submit}</button>
                <button className="btn btn-cancel" onClick={this.onCancel}>{__.cancel}</button>
              </div>
            </div>
          : ''}
        </div>
      </div>
    );
  }
}

module.exports = Detail;
