import React from 'react';
import ReactDOM from 'react-dom';
import { Modal } from 'antd';
import {
  FolderOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { getProject } from '../../features/project';
// import styles from './SideBarLeft.less';

interface SideBarLeftProps {
}

interface SideBarLeftState {
  visible: boolean;
}

export class SideBarLeft extends React.Component<SideBarLeftProps, SideBarLeftState> {
  constructor(props: Readonly<SideBarLeftProps>) {
    super(props);
    this.state = {
      visible: false,
    };
  }

  async componentDidMount() {
    const projects = await getProject();
    console.log(projects);
  }

  render() {
    return (
      <div className={styles.SideBarLeft}>
        <div className={styles.logo}>
          <SmileOutlined />
        </div>
        <div className={styles.item}>
          <FolderOutlined />
        </div>
        <div className={styles.divider}></div>
        <div className={styles.item}></div>
      </div>
    );
  }
}
