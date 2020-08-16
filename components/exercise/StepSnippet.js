import React, { useState, useEffect, useRef } from 'react';
import { Table, Row, Col, Menu, notification, Tooltip } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import AceEditor from 'react-ace';
import SnippetTemplate from './SnippetTemplate';
import axios from 'axios';

import 'ace-builds/src-noconflict/theme-kuroir';

const StepSnippet = ({ languages = [], setLanguages }) => {
  // table
  let [currPage, setCurrPage] = useState(1);
  let [currPageSize, setCurrPageSize] = useState(10);
  let [loading, setLoading] = useState(false);

  return (
    <div
      style={{
        marginBottom: '30px',
      }}>
      <Row
        style={{
          fontSize: '19px',
          marginBottom: 10,
        }}>
        Select supported Language
      </Row>
      <Table
        bordered
        loading={loading}
        dataSource={languages}
        columns={[
          {
            title: 'No.',
            key: 'no',
            width: '80px',
            render: (text, record, index) =>
              index + 1 + (currPage - 1) * currPageSize,
          },
          {
            title: 'Language',
            dataIndex: 'language',
            key: 'language',
            ellipsis: true,
          },
        ]}
        rowSelection={{
          selectedRowKeys: languages
            .filter((t) => t.isActive)
            .map((t) => t.key),
          onChange: (selectedRowKeys, selectedRows) =>
            setLanguages(
              [...languages].map((t) => ({
                ...t,
                isActive: selectedRowKeys.indexOf(t.key) !== -1,
              }))
            ),
          selections: [
            {
              key: 'selectAll',
              text: 'Select all data',
              onSelect: (changableRowKeys) => {
                setLanguages(
                  [...languages].map((t) => ({ ...t, isActive: true }))
                );
              },
            },
            {
              key: 'unselectAll',
              text: 'Unselect all data',
              onSelect: (changableRowKeys) => {
                setLanguages(
                  [...languages].map((t) => ({ ...t, isActive: false }))
                );
              },
            },
          ],
        }}
        expandable={{
          expandedRowRender: (record) => {
            return (
              <>
                <Row>Playground Templates</Row>
                <AceEditor
                  className='playground'
                  theme='kuroir'
                  value={record.sampleCode}
                  showGutter={true}
                  onChange={(value, event) => {
                    record.sampleCode = value;
                  }}
                  style={{ width: '100%', height: '300px' }}
                />
              </>
            );
          },
          expandIcon: ({ expanded, onExpand, record }) =>
            expanded ? (
              <Tooltip placement='right' title='Collapse'>
                <MinusOutlined onClick={(e) => onExpand(record, e)} />
              </Tooltip>
            ) : (
              <Tooltip
                placement='right'
                title='Expand to write template for this Language'>
                <PlusOutlined onClick={(e) => onExpand(record, e)} />
              </Tooltip>
            ),
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '30'],
        }}
        onChange={(pagination, filter, sorter) => {
          setCurrPageSize(pagination.pageSize);
          setCurrPage(pagination.current);
        }}
      />
    </div>
  );
};

export default StepSnippet;
