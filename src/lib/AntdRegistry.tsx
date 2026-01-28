'use client';

import React, { useState } from 'react';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import type Entity from '@ant-design/cssinjs/lib/Cache';
import { useServerInsertedHTML } from 'next/navigation';

import { ConfigProvider, App } from 'antd';
import theme from '../theme/themeConfig';

const AntdRegistry = ({ children }: React.PropsWithChildren) => {
  const cache = React.useMemo<Entity>(() => createCache(), []);
  const [isServerInserted, setIsServerInserted] = useState(false);

  useServerInsertedHTML(() => {
    // avoid duplicate insertion
    if (isServerInserted) return;
    setIsServerInserted(true);
    return (
      <style id="antd" dangerouslySetInnerHTML={{ __html: extractStyle(cache, true) }} />
    );
  });

  return (
    <StyleProvider cache={cache}>
      <ConfigProvider theme={theme}>
        <App>
          {children}
        </App>
      </ConfigProvider>
    </StyleProvider>
  );
};

export default AntdRegistry;
